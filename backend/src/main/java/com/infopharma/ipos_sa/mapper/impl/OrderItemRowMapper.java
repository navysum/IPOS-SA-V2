package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.DetailedOrderReport;
import com.infopharma.ipos_sa.entity.OrderItem;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class OrderItemRowMapper implements Mapper<OrderItem, DetailedOrderReport.DetailedOrderRow.ItemRow> {

    private final ModelMapper modelMapper;

    public OrderItemRowMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
        // quantity, unitCost, totalCost map automatically (exact name match).
        // item is a nested entity — flatten item.itemId and item.description.
        modelMapper.createTypeMap(OrderItem.class, DetailedOrderReport.DetailedOrderRow.ItemRow.class)
                .addMappings(m -> {
                    m.map(src -> src.getItem().getItemId(),      DetailedOrderReport.DetailedOrderRow.ItemRow::setItemId);
                    m.map(src -> src.getItem().getDescription(), DetailedOrderReport.DetailedOrderRow.ItemRow::setDescription);
                });
    }

    @Override
    public DetailedOrderReport.DetailedOrderRow.ItemRow mapTo(OrderItem orderItem) {
        return modelMapper.map(orderItem, DetailedOrderReport.DetailedOrderRow.ItemRow.class);
    }

    @Override
    public OrderItem mapFrom(DetailedOrderReport.DetailedOrderRow.ItemRow row) {
        return modelMapper.map(row, OrderItem.class);
    }
}
