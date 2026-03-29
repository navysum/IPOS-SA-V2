package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.dto.DiscountPlanRequest;
import com.infopharma.ipos_sa.entity.DiscountPlan;
import com.infopharma.ipos_sa.service.DiscountPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discount-plans")
public class DiscountPlanController {

    private final DiscountPlanService discountPlanService;

    public DiscountPlanController(DiscountPlanService discountPlanService) {
        this.discountPlanService = discountPlanService;
    }

    // POST /api/discount-plans — create a new discount plan with tiers
    @PostMapping
    public ResponseEntity<DiscountPlan> createDiscountPlan(@RequestBody DiscountPlanRequest request) {
        DiscountPlan created = discountPlanService.create(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // GET /api/discount-plans — list all discount plans
    @GetMapping
    public ResponseEntity<List<DiscountPlan>> getAllDiscountPlans() {
        return ResponseEntity.ok(discountPlanService.findAll());
    }

    // GET /api/discount-plans/{id} — get a single discount plan
    @GetMapping("/{id}")
    public ResponseEntity<DiscountPlan> getDiscountPlan(@PathVariable Integer id) {
        return discountPlanService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/discount-plans/{id} — update plan type and/or tiers
    @PutMapping("/{id}")
    public ResponseEntity<DiscountPlan> updateDiscountPlan(
            @PathVariable Integer id,
            @RequestBody DiscountPlanRequest request) {
        DiscountPlan updated = discountPlanService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/discount-plans/{id} — remove plan
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiscountPlan(@PathVariable Integer id) {
        discountPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
