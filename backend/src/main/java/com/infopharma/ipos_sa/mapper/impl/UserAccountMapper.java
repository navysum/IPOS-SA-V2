package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.CreateUserAccountRequest;
import com.infopharma.ipos_sa.entity.UserAccount;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class UserAccountMapper implements Mapper<UserAccount, CreateUserAccountRequest> {

    private final ModelMapper modelMapper;

    public UserAccountMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    @Override
    public CreateUserAccountRequest mapTo(UserAccount userAccount) {
        return modelMapper.map(userAccount, CreateUserAccountRequest.class);
    }

    @Override
    public UserAccount mapFrom(CreateUserAccountRequest createUserAccountRequest) {
        return modelMapper.map(createUserAccountRequest, UserAccount.class);
    }
}
