package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.CatalogueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogueItemRepository extends JpaRepository<CatalogueItem, String> {
    List<CatalogueItem> findByDescriptionContainingIgnoreCase(String keyword);
    List<CatalogueItem> findByItemIdContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String itemId, String description);
    List<CatalogueItem> findByAvailabilityLessThan(int threshold);
}
