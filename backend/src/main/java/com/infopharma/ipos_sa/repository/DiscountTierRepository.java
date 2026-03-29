package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.DiscountTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountTierRepository  extends JpaRepository<DiscountTier,Integer> {
}
