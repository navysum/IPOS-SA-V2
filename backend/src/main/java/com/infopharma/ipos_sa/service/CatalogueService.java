package com.infopharma.ipos_sa.service;

import com.infopharma.ipos_sa.dto.LowStockReportItem;
import com.infopharma.ipos_sa.dto.StockAddRequest;
import com.infopharma.ipos_sa.entity.CatalogueItem;

import java.util.List;
import java.util.Optional;

public interface CatalogueService {
    CatalogueItem addItem(CatalogueItem item);
    CatalogueItem update(String itemId, CatalogueItem item);
    void delete(String itemId);
    Optional<CatalogueItem> findById(String itemId);
    List<CatalogueItem> findAll();
    List<CatalogueItem> search(String keyword);
    void addStock(String itemId, StockAddRequest request);
    List<LowStockReportItem> getLowStockReport();
}
