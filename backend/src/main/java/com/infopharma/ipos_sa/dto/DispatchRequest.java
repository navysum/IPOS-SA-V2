package com.infopharma.ipos_sa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DispatchRequest {
    private String dispatchedBy;
    private String courier;
    private String courierRef;
    private LocalDate expectedDelivery;
}
