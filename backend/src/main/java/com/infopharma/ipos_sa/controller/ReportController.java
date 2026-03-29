package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.dto.*;
import com.infopharma.ipos_sa.entity.Invoice;
import com.infopharma.ipos_sa.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/reports/turnover?from=&to= — overall sales turnover for a date range
    @GetMapping("/turnover")
    public ResponseEntity<TurnoverReport> getTurnoverReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getTurnoverReport(from, to));
    }

    // GET /api/reports/merchant/{id}/orders?from=&to= — order summary for one merchant
    @GetMapping("/merchant/{id}/orders")
    public ResponseEntity<MerchantOrdersSummary> getMerchantOrdersSummary(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getMerchantOrdersSummary(id, from, to));
    }

    // GET /api/reports/merchant/{id}/orders/detailed?from=&to= — detailed orders with line items
    @GetMapping("/merchant/{id}/orders/detailed")
    public ResponseEntity<DetailedOrderReport> getMerchantDetailedOrders(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getMerchantDetailedOrders(id, from, to));
    }

    // GET /api/reports/merchant/{id}/invoices?from=&to= — invoices for one merchant
    @GetMapping("/merchant/{id}/invoices")
    public ResponseEntity<List<Invoice>> getMerchantInvoices(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getMerchantInvoices(id, from, to));
    }

    // GET /api/reports/invoices?from=&to= — all invoices across all merchants
    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> getAllInvoices(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getAllInvoices(from, to));
    }

    // GET /api/reports/stock-turnover?from=&to= — stock received vs sold per item
    @GetMapping("/stock-turnover")
    public ResponseEntity<StockTurnoverReport> getStockTurnoverReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getStockTurnoverReport(from, to));
    }
}
