package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.DiscountPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountPlanRepository extends JpaRepository<DiscountPlan,Integer> {
}
