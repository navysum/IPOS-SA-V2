package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.MonthlyDiscount;
import com.infopharma.ipos_sa.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyDiscountRepository extends JpaRepository<MonthlyDiscount,Integer> {
    List<MonthlyDiscount> findByAccount(UserAccount account);
    Optional<MonthlyDiscount> findByAccountAndMonthYear(UserAccount account, LocalDate monthYear);
    List<MonthlyDiscount> findBySettledFalse();
}
