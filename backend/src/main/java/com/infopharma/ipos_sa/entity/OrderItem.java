package com.infopharma.ipos_sa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "order_items")
@ToString(exclude = {"order", "item"})
@EqualsAndHashCode(of = "orderItemId")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private CatalogueItem item;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalCost;
}
