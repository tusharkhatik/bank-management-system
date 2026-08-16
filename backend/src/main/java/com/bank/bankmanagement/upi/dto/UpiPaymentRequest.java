package com.bank.bankmanagement.upi.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class UpiPaymentRequest {

    @NotBlank(message = "Sender UPI ID is required")
    private String senderUpiId;

    @NotBlank(message = "Receiver UPI ID is required")
    private String receiverUpiId;

    @NotNull(message = "Amount is required")
    @DecimalMin(
            value = "0.01",
            inclusive = true,
            message = "Amount must be at least 0.01"
    )
    private BigDecimal amount;

    public UpiPaymentRequest() {
    }

    public String getSenderUpiId() {
        return senderUpiId;
    }

    public void setSenderUpiId(String senderUpiId) {
        this.senderUpiId = senderUpiId;
    }

    public String getReceiverUpiId() {
        return receiverUpiId;
    }

    public void setReceiverUpiId(String receiverUpiId) {
        this.receiverUpiId = receiverUpiId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
