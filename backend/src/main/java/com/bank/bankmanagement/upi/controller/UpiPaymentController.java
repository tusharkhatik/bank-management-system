package com.bank.bankmanagement.upi.controller;

import com.bank.bankmanagement.upi.dto.UpiPaymentRequest;
import com.bank.bankmanagement.upi.dto.UpiPaymentResponse;
import com.bank.bankmanagement.upi.service.UpiPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/upi")
public class UpiPaymentController {

    private final UpiPaymentService upiPaymentService;

    public UpiPaymentController(
            UpiPaymentService upiPaymentService
    ) {
        this.upiPaymentService = upiPaymentService;
    }

    @PostMapping("/pay")
    public ResponseEntity<UpiPaymentResponse> makePayment(
            @Valid @RequestBody UpiPaymentRequest request
    ) {
        return ResponseEntity.ok(
                upiPaymentService.makePayment(request)
        );
    }
}
