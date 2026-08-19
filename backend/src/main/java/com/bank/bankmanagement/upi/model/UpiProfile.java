package com.bank.bankmanagement.upi.model;

import com.bank.bankmanagement.model.Account;
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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;
    @Column(nullable = false)
    private boolean active = true;

    public UpiProfile() {
    }

    public UpiProfile(String upiId, String displayName, Account account) {
        this.upiId = upiId;
        this.displayName = displayName;
        this.account = account;
        this.active = true;
    }

    public Long getAccountId() {
        return account != null ? account.getId() : null;
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

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
