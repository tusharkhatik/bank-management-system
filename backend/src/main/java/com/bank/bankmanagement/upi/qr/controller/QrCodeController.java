package com.bank.bankmanagement.upi.qr.controller;

import com.bank.bankmanagement.upi.qr.dto.QrCodeResponse;
import com.bank.bankmanagement.upi.qr.service.QrCodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/upi/qr")
public class QrCodeController {

    private final QrCodeService qrCodeService;

    public QrCodeController(QrCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping("/{upiId}")
    public ResponseEntity<QrCodeResponse> generateQr(
            @PathVariable String upiId
    ) {

        return ResponseEntity.ok(
                qrCodeService.generateForUpi(upiId)
        );
    }
}
