package com.infopharma.ipos_sa.mapper.impl;

import com.infopharma.ipos_sa.dto.DebtorReminderItem;
import com.infopharma.ipos_sa.entity.UserAccount;
import com.infopharma.ipos_sa.mapper.Mapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class DebtorReminderMapper implements Mapper<UserAccount, DebtorReminderItem> {

    private final ModelMapper modelMapper;

    public DebtorReminderMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
        // accountId, companyName, contactName, email, balance, paymentDueDate map automatically.
        // accountStatus is an enum in UserAccount but a String in the DTO — convert via .name().
        // daysOverdue is computed from current date — caller sets it after mapTo().
        modelMapper.createTypeMap(UserAccount.class, DebtorReminderItem.class)
                .addMappings(m -> m
                        .using(ctx -> ((UserAccount.AccountStatus) ctx.getSource()).name())
                        .map(UserAccount::getAccountStatus, DebtorReminderItem::setAccountStatus));
    }

    @Override
    public DebtorReminderItem mapTo(UserAccount account) {
        // daysOverdue remains 0 — caller must set it after this call.
        return modelMapper.map(account, DebtorReminderItem.class);
    }

    @Override
    public UserAccount mapFrom(DebtorReminderItem dto) {
        return modelMapper.map(dto, UserAccount.class);
    }
}
