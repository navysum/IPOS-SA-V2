package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.dto.LowStockReportItem;
import com.infopharma.ipos_sa.dto.StockAddRequest;
import com.infopharma.ipos_sa.entity.CatalogueItem;
import com.infopharma.ipos_sa.entity.StockDelivery;
import com.infopharma.ipos_sa.mapper.Mapper;
import com.infopharma.ipos_sa.repository.CatalogueItemRepository;
import com.infopharma.ipos_sa.repository.StockDeliveryRepository;
import com.infopharma.ipos_sa.service.CatalogueService;
import jakarta.persistence.EntityNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CatalogueServiceImpl implements CatalogueService {

    private final CatalogueItemRepository catalogueItemRepository;
    private final StockDeliveryRepository stockDeliveryRepository;
    private final ModelMapper modelMapper;                              // used only for in-place partial update
    private final Mapper<StockDelivery, StockAddRequest> stockDeliveryMapper;

    public CatalogueServiceImpl(CatalogueItemRepository catalogueItemRepository,
                                StockDeliveryRepository stockDeliveryRepository,
                                ModelMapper modelMapper,
                                Mapper<StockDelivery, StockAddRequest> stockDeliveryMapper) {
        this.catalogueItemRepository = catalogueItemRepository;
        this.stockDeliveryRepository = stockDeliveryRepository;
        this.modelMapper = modelMapper;
        this.stockDeliveryMapper = stockDeliveryMapper;
    }

    @Override
    public CatalogueItem addItem(CatalogueItem item) {
        if (item.getItemId() == null || item.getItemId().isBlank()) {
            // Auto-generate a unique 6-digit numeric ID
            String id;
            do {
                id = String.format("%06d", (int)(Math.random() * 900000) + 100000);
            } while (catalogueItemRepository.existsById(id));
            item.setItemId(id);
        }
        return catalogueItemRepository.save(item);
    }

    @Override
    public CatalogueItem update(String itemId, CatalogueItem updated) {
        CatalogueItem existing = catalogueItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found: " + itemId));
        modelMapper.map(updated, existing); // skip-null: only overwrites fields present in request body
        existing.setItemId(itemId);         // ensure path-param ID is never overwritten (old id overrides any changes)
        return catalogueItemRepository.save(existing);
    }

    @Override
    public void delete(String itemId) {
        if (!catalogueItemRepository.existsById(itemId)) {
            throw new EntityNotFoundException("Item not found: " + itemId);
        }
        catalogueItemRepository.deleteById(itemId);
    }

    @Override
    public Optional<CatalogueItem> findById(String itemId) {
        return catalogueItemRepository.findById(itemId);
    }

    @Override
    public List<CatalogueItem> findAll() {
        return catalogueItemRepository.findAll();
    }

    @Override
    public List<CatalogueItem> search(String keyword) {
        return catalogueItemRepository.findByItemIdContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword);
    }

    @Override
    @Transactional
    public void addStock(String itemId, StockAddRequest request) {
        CatalogueItem item = catalogueItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found: " + itemId));
        item.setAvailability(item.getAvailability() + request.getQuantity());
        catalogueItemRepository.save(item);

        StockDelivery delivery = stockDeliveryMapper.mapFrom(request); // maps quantityReceived + recordedBy
        delivery.setItem(item);
        delivery.setDeliveryDate(LocalDate.now());
        stockDeliveryRepository.save(delivery);
    }

    @Override
    public List<LowStockReportItem> getLowStockReport() {
        return catalogueItemRepository.findAll().stream()
                .filter(i -> i.getAvailability() < i.getMinStockLevel())
                .map(i -> {
                    double buffer = 1 + (i.getReorderBufferPct().doubleValue() / 100);
                    int recommended = (int) Math.ceil((i.getMinStockLevel() * buffer) - i.getAvailability());
                    return new LowStockReportItem(
                            i.getItemId(), i.getDescription(),
                            i.getAvailability(), i.getMinStockLevel(), recommended);
                })
                .collect(Collectors.toList());
    }
}
