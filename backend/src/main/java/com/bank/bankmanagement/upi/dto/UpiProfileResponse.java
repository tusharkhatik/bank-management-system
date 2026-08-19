package com.bank.bankmanagement.upi.dto;

import com.bank.bankmanagement.upi.model.UpiProfile;

public class UpiProfileResponse {

    private Long id;
    private String upiId;
    private String displayName;
    private Long accountId;
    private boolean active;

    public UpiProfileResponse() {
    }

    public UpiProfileResponse(UpiProfile profile) {
        this.id = profile.getId();
        this.upiId = profile.getUpiId();
        this.displayName = profile.getDisplayName();
        this.accountId = profile.getAccount().getId();
        this.active = profile.isActive();
    }

    public Long getId() {
        return id;
    }

    public String getUpiId() {
        return upiId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Long getAccountId() {
        return accountId;
    }

    public boolean isActive() {
        return active;
    }
}
