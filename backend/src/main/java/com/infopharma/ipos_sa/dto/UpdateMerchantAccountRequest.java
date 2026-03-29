package com.infopharma.ipos_sa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infopharma.ipos_sa.entity.UserAccount;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateMerchantAccountRequest {

    // Basic account info
    private String username;
    private String password; // only for creation; omit on update if password not changed

    // Contact info
    private String contactName;
    private String companyName;
    private String address;
    private String phone;
    private String fax;
    private String email;

    // Optional merchant-only fields
    private BigDecimal creditLimit;      // optional for admin updates
    private UserAccount.AccountStatus accountStatus; // for admin/manager control
    private UserAccount.AccountType accountType; // usually fixed to MERCHANT
    private LocalDate paymentDueDate;    // optional, usually set by system/admin
}