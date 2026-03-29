package com.infopharma.ipos_sa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "monthly_discounts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "month_year"}))
@ToString(exclude = "account")
@EqualsAndHashCode(of = "monthlyDiscountId")
public class MonthlyDiscount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "monthly_discount_id")
    private Integer monthlyDiscountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    @JsonIgnoreProperties({"discountPlan", "monthlyDiscounts", "password",
                           "hibernateLazyInitializer", "handler"})
    private UserAccount account;

    @Column(name = "month_year", nullable = false)
    private LocalDate monthYear;

    @Column(name = "total_orders_value", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalOrdersValue;

    @Column(name = "discount_rate_applied", precision = 5, scale = 2, nullable = false)
    private BigDecimal discountRateApplied;

    @Column(name = "discount_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal discountAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_method", nullable = false)
    private SettlementMethod settlementMethod;

    @Column(nullable = false)
    @Builder.Default
    private Boolean settled = false;

    public enum SettlementMethod { CHEQUE, ORDER_DEDUCTION }
}
