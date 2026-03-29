package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.dto.LowStockReportItem;
import com.infopharma.ipos_sa.dto.StockAddRequest;
import com.infopharma.ipos_sa.entity.CatalogueItem;
import com.infopharma.ipos_sa.service.CatalogueService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogue")
public class CatalogueController {

    private final CatalogueService catalogueService;

    public CatalogueController(CatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    // POST /api/catalogue — add a new item to the catalogue
    @PostMapping
    public ResponseEntity<CatalogueItem> addItem(@RequestBody CatalogueItem item) {
        CatalogueItem saved = catalogueService.addItem(item);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // GET /api/catalogue — list all catalogue items
    @GetMapping
    public ResponseEntity<List<CatalogueItem>> getAllItems() {
        return ResponseEntity.ok(catalogueService.findAll());
    }

    // GET /api/catalogue/search?keyword= — search items by description
    @GetMapping("/search")
    public ResponseEntity<List<CatalogueItem>> searchItems(@RequestParam String keyword) {
        return ResponseEntity.ok(catalogueService.search(keyword));
    }

    // GET /api/catalogue/low-stock — items below recommended reorder level
    @GetMapping("/low-stock")
    public ResponseEntity<List<LowStockReportItem>> getLowStockReport() {
        return ResponseEntity.ok(catalogueService.getLowStockReport());
    }

    // GET /api/catalogue/{id} — get one item
    @GetMapping("/{id}")
    public ResponseEntity<CatalogueItem> getItem(@PathVariable String id) {
        return catalogueService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/catalogue/{id} — update item details (partial update)
    @PutMapping("/{id}")
    public ResponseEntity<CatalogueItem> updateItem(
            @PathVariable String id,
            @RequestBody CatalogueItem item) {
        CatalogueItem updated = catalogueService.update(id, item);
        return ResponseEntity.ok(updated);
    }

    // PUT /api/catalogue/{id}/stock — add stock (record stock delivery)
    @PutMapping("/{id}/stock")
    public ResponseEntity<Void> addStock(
            @PathVariable String id,
            @RequestBody StockAddRequest request) {
        catalogueService.addStock(id, request);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/catalogue/{id} — remove item from catalogue
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        catalogueService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
