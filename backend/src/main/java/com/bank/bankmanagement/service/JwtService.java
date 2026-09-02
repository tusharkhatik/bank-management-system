package com.bank.bankmanagement.service;

import com.bank.bankmanagement.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final long TOKEN_EXPIRATION_MS =
            1000L * 60 * 60;

    private final SecretKey secretKey;

    public JwtService(
            @Value("${jwt.secret}") String secret) {

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET is not configured"
            );
        }

        byte[] keyBytes =
                secret.getBytes(StandardCharsets.UTF_8);

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 32 bytes long"
            );
        }

        this.secretKey =
                Keys.hmacShaKeyFor(keyBytes);
    }

    // =========================================================
    // GENERATE TOKEN
    // =========================================================

    public String generateToken(User user) {

        if (user == null) {
            throw new IllegalArgumentException(
                    "User is required"
            );
        }

        String role =
                normalizeRole(user.getRole());

        if (!"USER".equals(role)
                && !"ADMIN".equals(role)) {

            throw new IllegalStateException(
                    "Invalid user role"
            );
        }

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + TOKEN_EXPIRATION_MS
                        )
                )
                .signWith(secretKey)
                .compact();
    }

    // =========================================================
    // EXTRACT USERNAME
    // =========================================================

    public String extractUsername(String token) {

        return getClaims(token)
                .getSubject();
    }

    // =========================================================
    // EXTRACT ROLE
    // =========================================================

    public String extractRole(String token) {

        return normalizeRole(
                getClaims(token)
                        .get("role", String.class)
        );
    }

    // =========================================================
    // VALIDATE TOKEN
    // =========================================================

    public boolean isTokenValid(String token) {

        try {

            if (token == null || token.isBlank()) {
                return false;
            }

            Claims claims = getClaims(token);

            String username =
                    claims.getSubject();

            Date expiration =
                    claims.getExpiration();

            return username != null
                    && !username.isBlank()
                    && expiration != null
                    && expiration.after(new Date());

        } catch (Exception e) {

            return false;
        }
    }

    // =========================================================
    // GET CLAIMS
    // =========================================================

    private Claims getClaims(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // =========================================================
    // NORMALIZE ROLE
    // =========================================================

    private String normalizeRole(String role) {

        if (role == null) {
            return null;
        }

        String normalized =
                role.trim().toUpperCase();

        if (normalized.startsWith("ROLE_")) {
            normalized =
                    normalized.substring(5);
        }

        return normalized;
    }
}