package com.infopharma.ipos_sa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DebtorReminderItem {
    private Long accountId;
    private String companyName;
    private String contactName;
    private String email;
    private BigDecimal balance;
    private LocalDate paymentDueDate;
    private long daysOverdue;
    private String accountStatus;
}
