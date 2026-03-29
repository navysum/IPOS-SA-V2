package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.MonthlyDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonthlyDiscountRepository extends JpaRepository<MonthlyDiscount,Integer> {
}
