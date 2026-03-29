package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.dto.*;
import com.infopharma.ipos_sa.entity.*;
import com.infopharma.ipos_sa.mapper.Mapper;
import com.infopharma.ipos_sa.mapper.impl.DebtorReminderMapper;
import com.infopharma.ipos_sa.mapper.impl.OrderItemRowMapper;
import com.infopharma.ipos_sa.mapper.impl.OrderSummaryRowMapper;
import com.infopharma.ipos_sa.mapper.impl.TurnoverRowMapper;
import com.infopharma.ipos_sa.repository.*;
import com.infopharma.ipos_sa.service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserAccountRepository userAccountRepository;
    private final StockDeliveryRepository stockDeliveryRepository;
    private final TurnoverRowMapper turnoverRowMapper;
    private final OrderSummaryRowMapper orderSummaryRowMapper;
    private final OrderItemRowMapper orderItemRowMapper;
    private final DebtorReminderMapper debtorReminderMapper;

    public ReportServiceImpl(OrderRepository orderRepository,
                             OrderItemRepository orderItemRepository,
                             InvoiceRepository invoiceRepository,
                             UserAccountRepository userAccountRepository,
                             StockDeliveryRepository stockDeliveryRepository,
                             TurnoverRowMapper turnoverRowMapper,
                             OrderSummaryRowMapper orderSummaryRowMapper,
                             OrderItemRowMapper orderItemRowMapper,
                             DebtorReminderMapper debtorReminderMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.userAccountRepository = userAccountRepository;
        this.stockDeliveryRepository = stockDeliveryRepository;
        this.turnoverRowMapper = turnoverRowMapper;
        this.orderSummaryRowMapper = orderSummaryRowMapper;
        this.orderItemRowMapper = orderItemRowMapper;
        this.debtorReminderMapper = debtorReminderMapper;
    }

    @Override
    public TurnoverReport getTurnoverReport(LocalDate from, LocalDate to) {
        List<Order> orders = orderRepository.findByOrderDateBetween(from, to);
        BigDecimal total = orders.stream()
                .map(Order::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        TurnoverReport report = new TurnoverReport();
        report.setFrom(from);
        report.setTo(to);
        report.setTotalRevenue(total);
        report.setTotalOrders(orders.size());
        report.setRows(orders.stream().map(turnoverRowMapper::mapTo).collect(Collectors.toList()));
        return report;
    }

    @Override
    public MerchantOrdersSummary getMerchantOrdersSummary(Long accountId, LocalDate from, LocalDate to) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        List<Order> orders = orderRepository.findByAccountAndOrderDateBetween(account, from, to);
        BigDecimal total = orders.stream()
                .map(Order::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        MerchantOrdersSummary summary = new MerchantOrdersSummary();
        summary.setAccountId(accountId);
        summary.setCompanyName(account.getCompanyName());
        summary.setFrom(from);
        summary.setTo(to);
        summary.setOrders(orders.stream().map(orderSummaryRowMapper::mapTo).collect(Collectors.toList()));
        summary.setTotalValue(total);
        return summary;
    }

    @Override
    public DetailedOrderReport getMerchantDetailedOrders(Long accountId, LocalDate from, LocalDate to) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        List<Order> orders = orderRepository.findByAccountAndOrderDateBetween(account, from, to);
        BigDecimal grandTotal = BigDecimal.ZERO;

        List<DetailedOrderReport.DetailedOrderRow> rows = new java.util.ArrayList<>();
        for (Order o : orders) {
            List<DetailedOrderReport.DetailedOrderRow.ItemRow> itemRows = orderItemRepository.findByOrder(o)
                    .stream()
                    .map(orderItemRowMapper::mapTo)
                    .collect(Collectors.toList());

            DetailedOrderReport.DetailedOrderRow row = new DetailedOrderReport.DetailedOrderRow();
            row.setOrderId(o.getOrderId());
            row.setOrderDate(o.getOrderDate());
            row.setTotalValue(o.getTotalValue());
            row.setDiscountApplied(o.getDiscountApplied());
            row.setItems(itemRows);
            rows.add(row);
            grandTotal = grandTotal.add(o.getTotalValue());
        }

        DetailedOrderReport report = new DetailedOrderReport();
        report.setAccountId(accountId);
        report.setCompanyName(account.getCompanyName());
        report.setFrom(from);
        report.setTo(to);
        report.setOrders(rows);
        report.setGrandTotal(grandTotal);
        return report;
    }

    @Override
    public List<Invoice> getMerchantInvoices(Long accountId, LocalDate from, LocalDate to) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        return invoiceRepository.findByAccountAndInvoiceDateBetween(account, from, to);
    }

    @Override
    public List<Invoice> getAllInvoices(LocalDate from, LocalDate to) {
        return invoiceRepository.findByInvoiceDateBetween(from, to);
    }

    @Override
    public StockTurnoverReport getStockTurnoverReport(LocalDate from, LocalDate to) {
        List<StockDelivery> deliveries = stockDeliveryRepository.findByDeliveryDateBetween(from, to);
        List<Order> orders = orderRepository.findByOrderDateBetween(from, to);

        java.util.Map<String, Integer> delivered = new java.util.HashMap<>();
        for (StockDelivery d : deliveries) {
            delivered.merge(d.getItem().getItemId(), d.getQuantityReceived(), Integer::sum);
        }

        java.util.Map<String, Integer> sold = new java.util.HashMap<>();
        java.util.Map<String, String> descriptions = new java.util.HashMap<>();
        for (Order o : orders) {
            for (OrderItem i : orderItemRepository.findByOrder(o)) {
                sold.merge(i.getItem().getItemId(), i.getQuantity(), Integer::sum);
                descriptions.put(i.getItem().getItemId(), i.getItem().getDescription());
            }
        }

        java.util.Set<String> allItems = new java.util.HashSet<>();
        allItems.addAll(delivered.keySet());
        allItems.addAll(sold.keySet());

        List<StockTurnoverReport.StockTurnoverRow> rows = allItems.stream()
                .map(id -> {
                    int del = delivered.getOrDefault(id, 0);
                    int s   = sold.getOrDefault(id, 0);
                    return new StockTurnoverReport.StockTurnoverRow(
                            id, descriptions.getOrDefault(id, id), del, s, del - s);
                })
                .collect(Collectors.toList());

        StockTurnoverReport report = new StockTurnoverReport();
        report.setFrom(from);
        report.setTo(to);
        report.setRows(rows);
        return report;
    }

    @Override
    public List<DebtorReminderItem> getDebtorReminders() {
        return userAccountRepository.findByAccountType(UserAccount.AccountType.MERCHANT).stream()
                .filter(a -> a.getPaymentDueDate() != null
                        && a.getBalance().compareTo(BigDecimal.ZERO) > 0
                        && LocalDate.now().isAfter(a.getPaymentDueDate()))
                .map(a -> {
                    DebtorReminderItem item = debtorReminderMapper.mapTo(a);
                    item.setDaysOverdue(ChronoUnit.DAYS.between(a.getPaymentDueDate(), LocalDate.now()));
                    return item;
                })
                .collect(Collectors.toList());
    }
}
