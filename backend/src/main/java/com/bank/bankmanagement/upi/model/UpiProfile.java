package com.bank.bankmanagement.upi.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "upi_profiles",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_upi_id", columnNames = "upi_id"),
        @UniqueConstraint(name = "uk_upi_account", columnNames = "account_id")
    }
)
public class UpiProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "upi_id", nullable = false, unique = true, length = 100)
    private String upiId;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "account_id", nullable = false, unique = true)
    private Long accountId;

    @Column(nullable = false)
    private boolean active = true;

    public UpiProfile() {
    }

    public UpiProfile(
            String upiId,
            String displayName,
            Long accountId
    ) {
        this.upiId = upiId;
        this.displayName = displayName;
        this.accountId = accountId;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
