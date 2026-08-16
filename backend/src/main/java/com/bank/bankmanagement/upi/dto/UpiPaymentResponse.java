package com.bank.bankmanagement.upi.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class UpiPaymentResponse {

    private String status;
    private String message;
    private String senderUpiId;
    private String receiverUpiId;
    private BigDecimal amount;
    private LocalDateTime timestamp;

    public UpiPaymentResponse() {
    }

    public UpiPaymentResponse(
            String status,
            String message,
            String senderUpiId,
            String receiverUpiId,
            BigDecimal amount
    ) {
        this.status = status;
        this.message = message;
        this.senderUpiId = senderUpiId;
        this.receiverUpiId = receiverUpiId;
        this.amount = amount;
        this.timestamp = LocalDateTime.now();
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public String getSenderUpiId() {
        return senderUpiId;
    }

    public String getReceiverUpiId() {
        return receiverUpiId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
