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
@Table(name = "payments")
@ToString(exclude = {"account", "invoice"})
@EqualsAndHashCode(of = "paymentId")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id", nullable = false)
    @JsonIgnoreProperties({"discountPlan", "monthlyDiscounts", "password",
                           "hibernateLazyInitializer", "handler"})
    private UserAccount account;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnoreProperties({"account", "order", "hibernateLazyInitializer", "handler"})
    private Invoice invoice;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "amount_paid", precision = 10, scale = 2, nullable = false)
    private BigDecimal amountPaid;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "recorded_by", length = 100)
    private String recordedBy;

    public enum PaymentMethod { BANK_TRANSFER, CARD, CHEQUE }
}
