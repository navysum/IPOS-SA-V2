package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    List<UserAccount> findByAccountType(UserAccount.AccountType accountType);
    Optional<UserAccount> findByUsername(String username);
    List<UserAccount> findByAccountStatus(UserAccount.AccountStatus accountStatus);
}
