package com.infopharma.ipos_sa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class MerchantOrdersSummary {
    private Long accountId;
    private String companyName;
    private LocalDate from;
    private LocalDate to;
    private List<OrderSummaryRow> orders;
    private BigDecimal totalValue;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderSummaryRow {
        private String orderId;
        private LocalDate orderDate;
        private BigDecimal totalValue;
        private LocalDate dispatchDate;
        private LocalDate deliveryDate;
        private String paymentStatus;
    }
}
