package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.StockDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockDeliveryRepository extends JpaRepository<StockDelivery, Integer> {
    List<StockDelivery> findByDeliveryDateBetween(LocalDate from, LocalDate to);
}
