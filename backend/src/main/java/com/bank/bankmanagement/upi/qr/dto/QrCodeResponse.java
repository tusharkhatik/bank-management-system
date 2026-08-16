package com.bank.bankmanagement.upi.qr.dto;

public class QrCodeResponse {

    private String upiId;
    private String displayName;
    private String qrData;
    private String qrCodeBase64;

    public QrCodeResponse() {
    }

    public QrCodeResponse(
            String upiId,
            String displayName,
            String qrData,
            String qrCodeBase64
    ) {
        this.upiId = upiId;
        this.displayName = displayName;
        this.qrData = qrData;
        this.qrCodeBase64 = qrCodeBase64;
    }

    public String getUpiId() {
        return upiId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getQrData() {
        return qrData;
    }

    public String getQrCodeBase64() {
        return qrCodeBase64;
    }
}
