package com.infopharma.ipos_sa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infopharma.ipos_sa.entity.DiscountPlan;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DiscountPlanRequest {

    private DiscountPlan.PlanType planType;
    private List<TierRequest> tiers;

    @Data
    @NoArgsConstructor
    public static class TierRequest {
        private BigDecimal minValue;
        private BigDecimal maxValue;    // null = no upper bound (top tier)
        private BigDecimal discountRate;
    }
}
