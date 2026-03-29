package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.UpdateMerchantAccountRequest;
import com.infopharma.ipos_sa.entity.UserAccount;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class UpdateMerchantMapper implements Mapper<UserAccount, UpdateMerchantAccountRequest> {

    private final ModelMapper modelMapper;

    public UpdateMerchantMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    @Override
    public UpdateMerchantAccountRequest mapTo(UserAccount userAccount) {
        return modelMapper.map(userAccount, UpdateMerchantAccountRequest.class);
    }

    @Override
    public UserAccount mapFrom(UpdateMerchantAccountRequest dto) {
        return modelMapper.map(dto, UserAccount.class);
    }
}