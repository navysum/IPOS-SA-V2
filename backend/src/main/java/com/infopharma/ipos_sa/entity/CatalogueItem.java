package com.infopharma.ipos_sa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "catalogue_items")
@ToString
@EqualsAndHashCode(of = "itemId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CatalogueItem {

    @Id
    @Column(name = "item_id", length = 15)
    private String itemId;

    @Column(length = 255, nullable = false)
    private String description;

    @Column(name = "package_type", length = 50, nullable = false)
    private String packageType;

    @Column(length = 20, nullable = false)
    private String unit;

    @Column(name = "units_in_pack", nullable = false)
    private Integer unitsInPack;

    @Column(name = "package_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal packageCost;

    @Column(nullable = false)
    private Integer availability;

    @Column(name = "min_stock_level", nullable = false)
    private Integer minStockLevel;

    @Column(name = "reorder_buffer_pct", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal reorderBufferPct = BigDecimal.valueOf(10.00);
}
