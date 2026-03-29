package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.MerchantOrdersSummary;
import com.infopharma.ipos_sa.entity.Order;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class OrderSummaryRowMapper implements Mapper<Order, MerchantOrdersSummary.OrderSummaryRow> {

    private final ModelMapper modelMapper;

    public OrderSummaryRowMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
        // orderId, orderDate, totalValue, dispatchDate, deliveryDate map automatically.
        // paymentStatus is an enum in Order but a String in the DTO — convert via .name().
        modelMapper.createTypeMap(Order.class, MerchantOrdersSummary.OrderSummaryRow.class)
                .addMappings(m -> m
                        .using(ctx -> ((Order.PaymentStatus) ctx.getSource()).name())
                        .map(Order::getPaymentStatus, MerchantOrdersSummary.OrderSummaryRow::setPaymentStatus));
    }

    @Override
    public MerchantOrdersSummary.OrderSummaryRow mapTo(Order order) {
        return modelMapper.map(order, MerchantOrdersSummary.OrderSummaryRow.class);
    }

    @Override
    public Order mapFrom(MerchantOrdersSummary.OrderSummaryRow row) {
        return modelMapper.map(row, Order.class);
    }
}
