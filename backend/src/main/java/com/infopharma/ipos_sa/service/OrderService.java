package com.infopharma.ipos_sa.service;

import com.infopharma.ipos_sa.dto.DispatchRequest;
import com.infopharma.ipos_sa.dto.OrderRequest;
import com.infopharma.ipos_sa.entity.Order;

import java.util.List;
import java.util.Optional;

public interface OrderService {
    Order placeOrder(OrderRequest request);
    Optional<Order> findById(String orderId);
    List<Order> findAll();
    List<Order> findByAccountId(Long accountId);
    /** Returns orders not yet delivered (accepted / being_processed / dispatched) */
    List<Order> findIncomplete();
    Order markBeingProcessed(String orderId);
    Order dispatch(String orderId, DispatchRequest request);
    Order markDelivered(String orderId);
}
