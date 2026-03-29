package com.infopharma.ipos_sa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "discount_tiers")
@ToString(exclude = "discountPlan")
@EqualsAndHashCode(of = "tierId")
public class DiscountTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tier_id")
    private Integer tierId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_plan_id", nullable = false)
    @JsonIgnoreProperties({"tiers", "hibernateLazyInitializer", "handler"})
    private DiscountPlan discountPlan;

    @Column(name = "min_value", precision = 10, scale = 2, nullable = false)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 10, scale = 2)
    private BigDecimal maxValue;

    @Column(name = "discount_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal discountRate;
}
