package com.bank.bankmanagement.upi.qr.service;

import com.bank.bankmanagement.upi.dto.UpiProfileResponse;
import com.bank.bankmanagement.upi.model.UpiProfile;
import com.bank.bankmanagement.upi.qr.dto.QrCodeResponse;
import com.bank.bankmanagement.upi.service.UpiProfileService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class QrCodeService {

    private final UpiProfileService upiProfileService;

    public QrCodeService(UpiProfileService upiProfileService) {
        this.upiProfileService = upiProfileService;
    }

    public QrCodeResponse generateForUpi(String upiId) {

        UpiProfile profile = upiProfileService.getByUpiId(upiId);

        if (!profile.isActive()) {
            throw new IllegalArgumentException("UPI profile is inactive");
        }

        String qrData = buildUpiPaymentData(profile);

        String qrCodeBase64 = generateQrBase64(qrData);

        return new QrCodeResponse(
                profile.getUpiId(),
                profile.getDisplayName(),
                qrData,
                qrCodeBase64
        );
    }

    private String buildUpiPaymentData(UpiProfile profile) {

        return "upi://pay"
                + "?pa=" + profile.getUpiId()
                + "&pn=" + encode(profile.getDisplayName())
                + "&cu=INR";
    }

    private String encode(String value) {
        return value.replace(" ", "%20");
    }

    private String generateQrBase64(String data) {

        try {

            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            BitMatrix matrix = qrCodeWriter.encode(
                    data,
                    BarcodeFormat.QR_CODE,
                    400,
                    400
            );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    matrix,
                    "PNG",
                    outputStream
            );

            return Base64.getEncoder()
                    .encodeToString(outputStream.toByteArray());

        } catch (WriterException | java.io.IOException e) {

            throw new IllegalStateException(
                    "Unable to generate QR code",
                    e
            );
        }
    }
}
