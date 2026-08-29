package com.bank.bankmanagement.upi.controller;

import com.bank.bankmanagement.upi.dto.CreateUpiProfileRequest;
import com.bank.bankmanagement.upi.dto.UpiProfileResponse;
import com.bank.bankmanagement.upi.model.UpiProfile;
import com.bank.bankmanagement.upi.service.UpiProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/upi")
public class UpiProfileController {

    private final UpiProfileService upiProfileService;

    public UpiProfileController(UpiProfileService upiProfileService) {
        this.upiProfileService = upiProfileService;
    }

    @PostMapping("/profile")
    public ResponseEntity<UpiProfileResponse> createProfile(
            @RequestBody CreateUpiProfileRequest request
    ) {

        UpiProfile profile =
                upiProfileService.createProfile(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new UpiProfileResponse(profile));
    }

    @GetMapping("/profile/{upiId}")
    public ResponseEntity<UpiProfileResponse> getByUpiId(
            @PathVariable String upiId
    ) {

        return ResponseEntity.ok(
                new UpiProfileResponse(
                        upiProfileService.getByUpiId(upiId)
                )
        );
    }

    @GetMapping("/profile/account/{accountId}")
    public ResponseEntity<UpiProfileResponse> getByAccountId(
            @PathVariable Long accountId
    ) {

        return ResponseEntity.ok(
                new UpiProfileResponse(
                        upiProfileService.getByAccountId(accountId)
                )
        );
    }

    @PatchMapping("/profile/{id}/status")
    public ResponseEntity<UpiProfileResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return ResponseEntity.ok(
                new UpiProfileResponse(
                        upiProfileService.updateStatus(id, active)
                )
        );
    }
@GetMapping("/profile/me")
public ResponseEntity<UpiProfileResponse> getMyProfile() {

    return ResponseEntity.ok(
            new UpiProfileResponse(
                    upiProfileService.getMyProfile()
            )
    );
}

}
