package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.DispatchRequest;
import com.infopharma.ipos_sa.entity.Order;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class DispatchMapper implements Mapper<Order, DispatchRequest> {

    private final ModelMapper modelMapper;

    public DispatchMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    /**
     * Maps dispatchedBy, courier, courierRef, expectedDelivery from the request
     * directly INTO an existing Order (all four field names match exactly).
     */
    public void applyTo(DispatchRequest request, Order order) {
        modelMapper.map(request, order);
    }

    @Override
    public DispatchRequest mapTo(Order order) {
        return modelMapper.map(order, DispatchRequest.class);
    }

    @Override
    public Order mapFrom(DispatchRequest request) {
        return modelMapper.map(request, Order.class);
    }
}
