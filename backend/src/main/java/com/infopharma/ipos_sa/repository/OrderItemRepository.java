package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.Order;
import com.infopharma.ipos_sa.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findByOrder(Order order);
}
