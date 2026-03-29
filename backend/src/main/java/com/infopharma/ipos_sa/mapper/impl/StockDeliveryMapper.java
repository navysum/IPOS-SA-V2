package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.StockAddRequest;
import com.infopharma.ipos_sa.entity.StockDelivery;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class StockDeliveryMapper implements Mapper<StockDelivery, StockAddRequest> {

    private final ModelMapper modelMapper;

    public StockDeliveryMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
        // StockAddRequest.quantity → StockDelivery.quantityReceived (names differ)
        // recordedBy → recordedBy maps automatically
        modelMapper.createTypeMap(StockAddRequest.class, StockDelivery.class)
                .addMappings(m -> m.map(StockAddRequest::getQuantity, StockDelivery::setQuantityReceived));
    }

    @Override
    public StockAddRequest mapTo(StockDelivery delivery) {
        return modelMapper.map(delivery, StockAddRequest.class);
    }

    @Override
    public StockDelivery mapFrom(StockAddRequest request) {
        // Returns StockDelivery with quantityReceived + recordedBy set.
        // Caller must still set: item, deliveryDate.
        return modelMapper.map(request, StockDelivery.class);
    }
}
