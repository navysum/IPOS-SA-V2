package com.infopharma.ipos_sa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infopharma.ipos_sa.entity.UserAccount;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateUserAccountRoleRequest {
    private Long accountId;
    private UserAccount.AccountType accountType;

}
