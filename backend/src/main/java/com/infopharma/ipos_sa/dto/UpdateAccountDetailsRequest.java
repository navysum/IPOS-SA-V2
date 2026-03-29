package com.infopharma.ipos_sa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infopharma.ipos_sa.entity.UserAccount;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateAccountDetailsRequest {
    private UserAccount.AccountType accountType;
    private UserAccount.AccountStatus accountStatus;
}
