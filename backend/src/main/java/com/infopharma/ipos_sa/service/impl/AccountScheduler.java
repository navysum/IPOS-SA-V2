package com.infopharma.ipos_sa.service.impl;

import com.infopharma.ipos_sa.service.UserService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AccountScheduler {

    private final UserService userService;

    public AccountScheduler(UserService userService) {
        this.userService = userService;
    }

    // Runs every midnight — updates merchant statuses based on payment due date
    @Scheduled(cron = "0 0 0 * * *")
    public void runNightlyStatusUpdates() {
        userService.updateAllMerchantStatuses();
    }
}
