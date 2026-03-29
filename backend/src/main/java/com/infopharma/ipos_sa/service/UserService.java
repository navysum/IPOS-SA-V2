package com.infopharma.ipos_sa.service;

import com.infopharma.ipos_sa.entity.UserAccount;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface UserService {

    UserAccount createAccount(UserAccount account);

    UserAccount updateAccount(UserAccount account);

    /** Cascades: deletes payments → invoices → orders then the account */
    void deleteAccount(Long id);

    Optional<UserAccount> findOne(Long id);

    List<UserAccount> findAll();

    UserAccount updateDiscountPlan(Long accountId, Integer discountPlanId);

    UserAccount updateCreditLimit(Long accountId, BigDecimal creditLimit);

    void updateAllMerchantStatuses();
}
