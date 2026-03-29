package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.dto.PaymentRequest;
import com.infopharma.ipos_sa.entity.Invoice;
import com.infopharma.ipos_sa.entity.Payment;
import com.infopharma.ipos_sa.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // POST /api/payments — record a payment against an invoice
    @PostMapping
    public ResponseEntity<Payment> recordPayment(@RequestBody PaymentRequest request) {
        Payment payment = paymentService.recordPayment(request);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }
}
