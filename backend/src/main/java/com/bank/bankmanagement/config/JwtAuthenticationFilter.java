package com.bank.bankmanagement.config;

import com.bank.bankmanagement.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        /*
         * =====================================================
         * Authorization header check
         * =====================================================
         */
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        /*
         * =====================================================
         * Extract JWT token
         * =====================================================
         */
        String token =
                authorizationHeader.substring(7).trim();

        if (token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        /*
         * =====================================================
         * JWT DEBUG
         * =====================================================
         */
        System.out.println("========== JWT DEBUG ==========");
        System.out.println(
                "Request: "
                        + request.getMethod()
                        + " "
                        + request.getRequestURI()
        );

        System.out.println(
                "Authorization header present: "
                        + (authorizationHeader != null)
        );

        System.out.println(
                "Token length: "
                        + token.length()
        );

        try {

            /*
             * =================================================
             * Validate JWT
             * =================================================
             */
            boolean tokenValid =
                    jwtService.isTokenValid(token);

            System.out.println(
                    "Token valid: "
                            + tokenValid
            );

            if (tokenValid) {

                /*
                 * =============================================
                 * Extract username and role
                 * =============================================
                 */
                String username =
                        jwtService.extractUsername(token);

                String role =
                        jwtService.extractRole(token);

                System.out.println(
                        "JWT username: "
                                + username
                );

                System.out.println(
                        "JWT role: "
                                + role
                );

                /*
                 * =============================================
                 * Create Spring Security authentication
                 * =============================================
                 */
                if (username != null
                        && !username.isBlank()
                        && role != null
                        && !role.isBlank()
                        && SecurityContextHolder
                                .getContext()
                                .getAuthentication() == null) {

                    String normalizedRole =
                            role.startsWith("ROLE_")
                                    ? role.substring(5)
                                    : role;

                    SimpleGrantedAuthority authority =
                            new SimpleGrantedAuthority(
                                    "ROLE_" + normalizedRole
                            );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    null,
                                    List.of(authority)
                            );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);

                    System.out.println(
                            "JWT AUTHENTICATION SET SUCCESSFULLY"
                    );

                    System.out.println(
                            "Authenticated user: "
                                    + username
                    );

                    System.out.println(
                            "Granted authority: ROLE_"
                                    + normalizedRole
                    );
                }

            } else {

                System.out.println(
                        "JWT TOKEN IS INVALID OR EXPIRED"
                );
            }

            System.out.println(
                    "SecurityContext authentication: "
                            + SecurityContextHolder
                                    .getContext()
                                    .getAuthentication()
            );

            System.out.println(
                    "==============================="
            );

        } catch (Exception e) {

            /*
             * =================================================
             * JWT authentication failure
             * =================================================
             */
            SecurityContextHolder.clearContext();

            System.err.println(
                    "========== JWT AUTHENTICATION FAILED =========="
            );

            System.err.println(
                    "Exception: "
                            + e.getClass().getName()
            );

            System.err.println(
                    "Message: "
                            + e.getMessage()
            );

            e.printStackTrace();

            System.err.println(
                    "================================================"
            );
        }

        /*
         * =====================================================
         * Continue filter chain
         * =====================================================
         */
        filterChain.doFilter(request, response);
    }
}