package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.dto.DiscountPlanRequest;
import com.infopharma.ipos_sa.entity.DiscountPlan;
import com.infopharma.ipos_sa.entity.DiscountTier;
import com.infopharma.ipos_sa.mapper.Mapper;
import com.infopharma.ipos_sa.repository.DiscountPlanRepository;
import com.infopharma.ipos_sa.service.DiscountPlanService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DiscountPlanServiceImpl implements DiscountPlanService {

    private final DiscountPlanRepository discountPlanRepository;
    private final Mapper<DiscountTier, DiscountPlanRequest.TierRequest> discountTierMapper;

    public DiscountPlanServiceImpl(DiscountPlanRepository discountPlanRepository,
                                   Mapper<DiscountTier, DiscountPlanRequest.TierRequest> discountTierMapper) {
        this.discountPlanRepository = discountPlanRepository;
        this.discountTierMapper = discountTierMapper;
    }

    @Override
    @Transactional
    public DiscountPlan create(DiscountPlanRequest request) {
        DiscountPlan plan = new DiscountPlan();
        plan.setPlanType(request.getPlanType());
        plan.setTiers(new ArrayList<>());
        DiscountPlan saved = discountPlanRepository.save(plan);

        if (request.getTiers() != null) {
            for (DiscountPlanRequest.TierRequest t : request.getTiers()) {
                DiscountTier tier = discountTierMapper.mapFrom(t);
                tier.setDiscountPlan(saved);
                saved.getTiers().add(tier);
            }
            saved = discountPlanRepository.save(saved);
        }
        return saved;
    }

    @Override
    @Transactional
    public DiscountPlan update(Integer id, DiscountPlanRequest request) {
        DiscountPlan plan = discountPlanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Discount plan not found: " + id));

        if (request.getPlanType() != null) {
            plan.setPlanType(request.getPlanType());
        }
        if (request.getTiers() != null) {
            plan.getTiers().clear();
            for (DiscountPlanRequest.TierRequest t : request.getTiers()) {
                DiscountTier tier = discountTierMapper.mapFrom(t);
                tier.setDiscountPlan(plan);
                plan.getTiers().add(tier);
            }
        }
        return discountPlanRepository.save(plan);
    }

    @Override
    public void delete(Integer id) {
        if (!discountPlanRepository.existsById(id)) {
            throw new EntityNotFoundException("Discount plan not found: " + id);
        }
        discountPlanRepository.deleteById(id);
    }

    @Override
    public Optional<DiscountPlan> findById(Integer id) {
        return discountPlanRepository.findById(id);
    }

    @Override
    public List<DiscountPlan> findAll() {
        return discountPlanRepository.findAll();
    }
}
