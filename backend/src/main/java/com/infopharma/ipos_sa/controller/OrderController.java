package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.dto.DispatchRequest;
import com.infopharma.ipos_sa.dto.OrderRequest;
import com.infopharma.ipos_sa.entity.Order;
import com.infopharma.ipos_sa.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // POST /api/orders — place a new order (validates stock, generates invoice)
    @PostMapping
    public ResponseEntity<Order> placeOrder(@RequestBody OrderRequest request) {
        Order created = orderService.placeOrder(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // GET /api/orders — list all orders (manager/staff view)
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }

    // GET /api/orders/incomplete — orders not yet delivered (accepted/processing/dispatched)
    @GetMapping("/incomplete")
    public ResponseEntity<List<Order>> getIncompleteOrders() {
        return ResponseEntity.ok(orderService.findIncomplete());
    }

    // GET /api/orders/my?accountId= — orders for a specific merchant account
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(@RequestParam Long accountId) {
        return ResponseEntity.ok(orderService.findByAccountId(accountId));
    }

    // GET /api/orders/{id} — get a single order by order ID
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable String id) {
        return orderService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/orders/{id}/process — mark order as being processed (accepted → being_processed)
    @PutMapping("/{id}/process")
    public ResponseEntity<Order> processOrder(@PathVariable String id) {
        Order updated = orderService.markBeingProcessed(id);
        return ResponseEntity.ok(updated);
    }

    // PUT /api/orders/{id}/dispatch — mark order as dispatched (staff action)
    @PutMapping("/{id}/dispatch")
    public ResponseEntity<Order> dispatchOrder(
            @PathVariable String id,
            @RequestBody DispatchRequest request) {
        Order updated = orderService.dispatch(id, request);
        return ResponseEntity.ok(updated);
    }

    // PUT /api/orders/{id}/delivered — mark order as delivered
    @PutMapping("/{id}/delivered")
    public ResponseEntity<Order> markDelivered(@PathVariable String id) {
        Order updated = orderService.markDelivered(id);
        return ResponseEntity.ok(updated);
    }
}
