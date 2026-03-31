package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.dto.PaymentRequest;
import com.infopharma.ipos_sa.entity.*;
import com.infopharma.ipos_sa.mapper.Mapper;
import com.infopharma.ipos_sa.repository.*;
import com.infopharma.ipos_sa.service.PaymentService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final UserAccountRepository userAccountRepository;
    private final Mapper<Payment, PaymentRequest> paymentMapper;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              InvoiceRepository invoiceRepository,
                              OrderRepository orderRepository,
                              UserAccountRepository userAccountRepository,
                              Mapper<Payment, PaymentRequest> paymentMapper) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.userAccountRepository = userAccountRepository;
        this.paymentMapper = paymentMapper;
    }

    @Override
    @Transactional
    public Payment recordPayment(PaymentRequest request) {
        UserAccount account = userAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + request.getAccountId()));
        // If no invoice ID supplied, pick the oldest unpaid invoice for this account
        Invoice invoice;
        if (request.getInvoiceId() == null || request.getInvoiceId().isBlank()) {
            invoice = invoiceRepository.findByAccount(account).stream()
                    .filter(i -> i.getOrder().getPaymentStatus() == Order.PaymentStatus.PENDING)
                    .min(java.util.Comparator.comparing(Invoice::getInvoiceDate))
                    .orElseThrow(() -> new EntityNotFoundException("No unpaid invoice found for account: " + request.getAccountId()));
        } else {
            invoice = invoiceRepository.findById(request.getInvoiceId())
                    .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + request.getInvoiceId()));
        }

        // maps amountPaid, paymentMethod, recordedBy — STRICT skips accountId/invoiceId (no match in Payment)
        Payment payment = paymentMapper.mapFrom(request);
        payment.setAccount(account);
        payment.setInvoice(invoice);
        payment.setPaymentDate(LocalDate.now());
        paymentRepository.save(payment);

        // Update balance
        account.setBalance(account.getBalance().subtract(request.getAmountPaid()));

        // Auto-restore SUSPENDED account when balance cleared
        if (account.getBalance().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            account.setPaymentDueDate(null);
            if (account.getAccountStatus() == UserAccount.AccountStatus.SUSPENDED) {
                account.setAccountStatus(UserAccount.AccountStatus.NORMAL);
            }
        }
        // IN_DEFAULT cannot be auto-restored — manager only
        userAccountRepository.save(account);

        // Mark the linked order as paid and persist explicitly
        Order order = invoice.getOrder();
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        orderRepository.save(order);

        return payment;
    }

    @Override
    public Optional<Invoice> findInvoiceById(String invoiceId) {
        return invoiceRepository.findById(invoiceId);
    }

    @Override
    public List<Invoice> findAllInvoices() {
        return invoiceRepository.findAll();
    }

    @Override
    public List<Invoice> findInvoicesByAccountId(Long accountId) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        return invoiceRepository.findByAccount(account);
    }
}
