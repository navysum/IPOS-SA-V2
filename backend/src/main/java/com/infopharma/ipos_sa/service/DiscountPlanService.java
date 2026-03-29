package com.infopharma.ipos_sa.service;

import com.infopharma.ipos_sa.dto.DiscountPlanRequest;
import com.infopharma.ipos_sa.entity.DiscountPlan;

import java.util.List;
import java.util.Optional;

public interface DiscountPlanService {
    DiscountPlan create(DiscountPlanRequest request);
    DiscountPlan update(Integer id, DiscountPlanRequest request);
    void delete(Integer id);
    Optional<DiscountPlan> findById(Integer id);
    List<DiscountPlan> findAll();
}
