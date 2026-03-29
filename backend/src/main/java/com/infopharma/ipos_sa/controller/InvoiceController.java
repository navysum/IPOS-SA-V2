package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.entity.Invoice;
import com.infopharma.ipos_sa.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final PaymentService paymentService;

    public InvoiceController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // GET /api/invoices — list all invoices
    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(paymentService.findAllInvoices());
    }

    // GET /api/invoices/{id} — get a single invoice
    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String id) {
        return paymentService.findInvoiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/invoices/account/{accountId} — all invoices for a merchant
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Invoice>> getInvoicesByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(paymentService.findInvoicesByAccountId(accountId));
    }
}
