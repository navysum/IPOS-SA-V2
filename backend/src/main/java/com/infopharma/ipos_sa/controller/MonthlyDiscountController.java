package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.entity.*;
import com.infopharma.ipos_sa.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monthly-discounts")
public class MonthlyDiscountController {

    private final MonthlyDiscountRepository monthlyDiscountRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrderRepository orderRepository;

    public MonthlyDiscountController(MonthlyDiscountRepository monthlyDiscountRepository,
                                     UserAccountRepository userAccountRepository,
                                     OrderRepository orderRepository) {
        this.monthlyDiscountRepository = monthlyDiscountRepository;
        this.userAccountRepository = userAccountRepository;
        this.orderRepository = orderRepository;
    }

    // GET /api/monthly-discounts — list all monthly discounts (pending/settled)
    @GetMapping
    public ResponseEntity<List<MonthlyDiscount>> getAll() {
        return ResponseEntity.ok(monthlyDiscountRepository.findAll());
    }

    // GET /api/monthly-discounts/pending — unsettled discounts
    @GetMapping("/pending")
    public ResponseEntity<List<MonthlyDiscount>> getPending() {
        return ResponseEntity.ok(monthlyDiscountRepository.findBySettledFalse());
    }

    // POST /api/monthly-discounts/calculate?month=2026-01-01 — calculate for all FLEXIBLE plan merchants
    @PostMapping("/calculate")
    public ResponseEntity<List<MonthlyDiscount>> calculate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        // Normalise to first day of month
        LocalDate monthStart = month.withDayOfMonth(1);
        LocalDate monthEnd   = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        List<UserAccount> merchants = userAccountRepository.findByAccountType(UserAccount.AccountType.MERCHANT);

        for (UserAccount merchant : merchants) {
            DiscountPlan plan = merchant.getDiscountPlan();
            if (plan == null || plan.getPlanType() != DiscountPlan.PlanType.FLEXIBLE) continue;

            // Total all delivered orders for this merchant in the month
            List<Order> orders = orderRepository.findByAccountAndOrderDateBetween(merchant, monthStart, monthEnd);
            BigDecimal total = orders.stream()
                    .map(Order::getTotalValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (total.compareTo(BigDecimal.ZERO) == 0) continue;

            // Find applicable tier
            BigDecimal rate = BigDecimal.ZERO;
            for (DiscountTier tier : plan.getTiers()) {
                BigDecimal min = tier.getMinValue();
                BigDecimal max = tier.getMaxValue();
                if (total.compareTo(min) >= 0 && (max == null || total.compareTo(max) < 0)) {
                    rate = tier.getDiscountRate();
                    break;
                }
            }

            if (rate.compareTo(BigDecimal.ZERO) == 0) continue;

            BigDecimal discountAmount = total.multiply(rate.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);

            // Upsert — skip if already calculated for this month
            if (monthlyDiscountRepository.findByAccountAndMonthYear(merchant, monthStart).isEmpty()) {
                MonthlyDiscount md = MonthlyDiscount.builder()
                        .account(merchant)
                        .monthYear(monthStart)
                        .totalOrdersValue(total)
                        .discountRateApplied(rate)
                        .discountAmount(discountAmount)
                        .settlementMethod(MonthlyDiscount.SettlementMethod.CHEQUE) // default
                        .settled(false)
                        .build();
                monthlyDiscountRepository.save(md);
            }
        }

        return new ResponseEntity<>(monthlyDiscountRepository.findBySettledFalse(), HttpStatus.CREATED);
    }

    // PUT /api/monthly-discounts/{id}/settle — mark a discount as settled
    @PutMapping("/{id}/settle")
    public ResponseEntity<MonthlyDiscount> settle(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        MonthlyDiscount md = monthlyDiscountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Monthly discount not found: " + id));

        String method = body.get("settlementMethod");
        if (method != null) {
            md.setSettlementMethod(MonthlyDiscount.SettlementMethod.valueOf(method.toUpperCase()));
        }
        md.setSettled(true);

        // If settled by ORDER_DEDUCTION, reduce the merchant's balance
        if (md.getSettlementMethod() == MonthlyDiscount.SettlementMethod.ORDER_DEDUCTION) {
            UserAccount account = md.getAccount();
            account.setBalance(account.getBalance().subtract(md.getDiscountAmount()).max(BigDecimal.ZERO));
            userAccountRepository.save(account);
        }

        return ResponseEntity.ok(monthlyDiscountRepository.save(md));
    }
}
