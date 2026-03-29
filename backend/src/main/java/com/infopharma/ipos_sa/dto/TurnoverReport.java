package com.infopharma.ipos_sa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class TurnoverReport {
    private LocalDate from;
    private LocalDate to;
    private BigDecimal totalRevenue;
    private int totalOrders;
    private List<TurnoverRow> rows;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TurnoverRow {
        private String orderId;
        private Long accountId;
        private String companyName;
        private LocalDate orderDate;
        private BigDecimal totalValue; // matches Order.totalValue — enables auto-mapping
    }
}
