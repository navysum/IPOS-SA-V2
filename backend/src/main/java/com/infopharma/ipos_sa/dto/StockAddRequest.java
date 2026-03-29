package com.infopharma.ipos_sa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StockAddRequest {
    private Integer quantity;
    private String recordedBy;
}
