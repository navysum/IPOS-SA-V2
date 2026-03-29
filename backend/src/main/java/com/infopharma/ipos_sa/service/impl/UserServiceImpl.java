package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.entity.*;
import com.infopharma.ipos_sa.repository.*;
import com.infopharma.ipos_sa.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserAccountRepository userAccountRepository;
    private final DiscountPlanRepository discountPlanRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public UserServiceImpl(UserAccountRepository userAccountRepository,
                           DiscountPlanRepository discountPlanRepository,
                           OrderRepository orderRepository,
                           InvoiceRepository invoiceRepository,
                           PaymentRepository paymentRepository) {
        this.userAccountRepository = userAccountRepository;
        this.discountPlanRepository = discountPlanRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    public UserAccount createAccount(UserAccount account) {
        return userAccountRepository.save(account);
    }

    @Override
    public UserAccount updateAccount(UserAccount account) {
        return userAccountRepository.save(account);
    }

    @Override
    @Transactional
    public void deleteAccount(Long id) {
        UserAccount account = userAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + id));
        // Cascade: payments → invoices → orders → account
        List<Payment> payments = paymentRepository.findByAccount(account);
        paymentRepository.deleteAll(payments);

        List<Invoice> invoices = invoiceRepository.findByAccount(account);
        invoiceRepository.deleteAll(invoices);

        List<Order> orders = orderRepository.findByAccount(account);
        orderRepository.deleteAll(orders);

        userAccountRepository.deleteById(id);
    }

    @Override
    public Optional<UserAccount> findOne(Long id) {
        return userAccountRepository.findById(id);
    }

    @Override
    public List<UserAccount> findAll() {
        return userAccountRepository.findAll();
    }

    @Override
    public UserAccount updateDiscountPlan(Long accountId, Integer discountPlanId) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        DiscountPlan plan = discountPlanRepository.findById(discountPlanId)
                .orElseThrow(() -> new EntityNotFoundException("Discount plan not found: " + discountPlanId));
        account.setDiscountPlan(plan);
        return userAccountRepository.save(account);
    }

    @Override
    public UserAccount updateCreditLimit(Long accountId, BigDecimal creditLimit) {
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
        account.setCreditLimit(creditLimit);
        return userAccountRepository.save(account);
    }

    @Override
    public void updateAllMerchantStatuses() {
        List<UserAccount> merchants = userAccountRepository.findByAccountType(UserAccount.AccountType.MERCHANT);
        for (UserAccount account : merchants) {
            if (account.getPaymentDueDate() == null) continue;
            // Only escalate status if there is an outstanding balance
            if (account.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
                if (account.getAccountStatus() != UserAccount.AccountStatus.NORMAL) {
                    account.setAccountStatus(UserAccount.AccountStatus.NORMAL);
                    userAccountRepository.save(account);
                }
                continue;
            }
            long daysLate = ChronoUnit.DAYS.between(account.getPaymentDueDate(), LocalDate.now());
            if (daysLate > 30) {
                account.setAccountStatus(UserAccount.AccountStatus.IN_DEFAULT);
            } else if (daysLate > 15) {
                account.setAccountStatus(UserAccount.AccountStatus.SUSPENDED);
            } else {
                account.setAccountStatus(UserAccount.AccountStatus.NORMAL);
            }
            userAccountRepository.save(account);
        }
    }
}
