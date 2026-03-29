package com.infopharma.ipos_sa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LowStockReportItem {
    private String itemId;
    private String description;
    private int currentAvailability;
    private int minStockLevel;
    private int recommendedOrderQty;
}
