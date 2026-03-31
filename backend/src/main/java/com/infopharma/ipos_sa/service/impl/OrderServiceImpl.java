package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.dto.DispatchRequest;
import com.infopharma.ipos_sa.dto.OrderRequest;
import com.infopharma.ipos_sa.entity.*;
import com.infopharma.ipos_sa.mapper.impl.DispatchMapper;
import com.infopharma.ipos_sa.repository.*;
import com.infopharma.ipos_sa.service.OrderService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserAccountRepository userAccountRepository;
    private final CatalogueItemRepository catalogueItemRepository;
    private final DispatchMapper dispatchMapper;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            InvoiceRepository invoiceRepository,
                            UserAccountRepository userAccountRepository,
                            CatalogueItemRepository catalogueItemRepository,
                            DispatchMapper dispatchMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.userAccountRepository = userAccountRepository;
        this.catalogueItemRepository = catalogueItemRepository;
        this.dispatchMapper = dispatchMapper;
    }

    @Override
    @Transactional
    public Order placeOrder(OrderRequest request) {
        UserAccount account = userAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + request.getAccountId()));

        if (account.getAccountStatus() == UserAccount.AccountStatus.SUSPENDED ||
            account.getAccountStatus() == UserAccount.AccountStatus.IN_DEFAULT) {
            throw new IllegalStateException("Account cannot place orders — status: " + account.getAccountStatus());
        }

        Order order = new Order();
        order.setOrderId(generateOrderId());
        order.setAccount(account);
        order.setOrderDate(LocalDate.now());
        order.setStatus(Order.OrderStatus.ACCEPTED);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setDiscountApplied(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();

        for (OrderRequest.OrderItemRequest req : request.getItems()) {
            CatalogueItem ci = catalogueItemRepository.findById(req.getItemId())
                    .orElseThrow(() -> new EntityNotFoundException("Item not found: " + req.getItemId()));

            ci.setAvailability(ci.getAvailability() - req.getQuantity());
            catalogueItemRepository.save(ci);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setItem(ci);
            item.setQuantity(req.getQuantity());
            item.setUnitCost(ci.getPackageCost());
            item.setTotalCost(ci.getPackageCost().multiply(BigDecimal.valueOf(req.getQuantity())));
            total = total.add(item.getTotalCost());
            items.add(item);
        }

        // Apply fixed-rate discount at order time (FLEXIBLE plans are settled monthly)
        BigDecimal discount = BigDecimal.ZERO;
        com.infopharma.ipos_sa.entity.DiscountPlan plan = account.getDiscountPlan();
        if (plan != null && plan.getPlanType() == com.infopharma.ipos_sa.entity.DiscountPlan.PlanType.FIXED
                && !plan.getTiers().isEmpty()) {
            BigDecimal rate = plan.getTiers().get(0).getDiscountRate()
                    .divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP);
            discount = total.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            total = total.subtract(discount);
        }

        order.setDiscountApplied(discount);
        order.setTotalValue(total);
        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(items);

        // Auto-generate invoice (amount due = discounted total)
        Invoice invoice = new Invoice();
        invoice.setInvoiceId(generateInvoiceId());
        invoice.setOrder(savedOrder);
        invoice.setAccount(account);
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setAmountDue(total);
        invoiceRepository.save(invoice);

        // Update merchant balance (discounted total increases the balance owed)
        account.setBalance(account.getBalance().add(total));

        // Set payment due date to 30 days from today if not already set
        if (account.getPaymentDueDate() == null) {
            account.setPaymentDueDate(LocalDate.now().plusDays(30));
        }
        userAccountRepository.save(account);

        return savedOrder;
    }

    @Override
    public Optional<Order> findById(String orderId) {
        return orderRepository.findById(orderId);
    }

    @Override
    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    @Override
    public List<Order> findByAccountId(Long accountId) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        return orderRepository.findByAccount(account);
    }

    @Override
    public List<Order> findIncomplete() {
        return orderRepository.findByStatusNot(Order.OrderStatus.DELIVERED);
    }

    @Override
    @Transactional
    public Order markBeingProcessed(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
        order.setStatus(Order.OrderStatus.BEING_PROCESSED);
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order dispatch(String orderId, DispatchRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
        order.setStatus(Order.OrderStatus.DISPATCHED);
        order.setDispatchDate(LocalDate.now());
        dispatchMapper.applyTo(request, order); // maps dispatchedBy, courier, courierRef, expectedDelivery
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order markDelivered(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setDeliveryDate(LocalDate.now());
        return orderRepository.save(order);
    }

    private String generateOrderId() {
        String id;
        do {
            id = "IP" + String.format("%04d", ThreadLocalRandom.current().nextInt(1000, 9999));
        } while (orderRepository.existsById(id));
        return id;
    }

    private String generateInvoiceId() {
        String id;
        do {
            id = String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 999999));
        } while (invoiceRepository.existsById(id));
        return id;
    }
}
