package com.bank.bankmanagement.config;

import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.UserRepository;
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
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        /*
         * Always allow CORS preflight to continue.
         *
         * Spring Security CORS processing will handle
         * the actual CORS headers.
         */
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorizationHeader =
                request.getHeader("Authorization");

        /*
         * No JWT.
         *
         * This is allowed here.
         * Spring Security will decide whether the
         * requested endpoint requires authentication.
         */
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authorizationHeader.substring(7).trim();

        if (token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            /*
             * Validate JWT signature and expiration.
             */
            if (!jwtService.isTokenValid(token)) {

                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
                return;
            }

            /*
             * Get username from JWT.
             */
            String username =
                    jwtService.extractUsername(token);

            if (username == null || username.isBlank()) {

                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
                return;
            }

            /*
             * IMPORTANT:
             *
             * Do not trust the role stored inside the JWT.
             *
             * Load the current user from the database.
             * This means if an administrator changes a user's
             * role in the database, the next request gets the
             * current role.
             */
            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
                return;
            }

            /*
             * Don't overwrite an existing authentication.
             */
            if (SecurityContextHolder
                    .getContext()
                    .getAuthentication() == null) {

                String role = user.getRole();

                if (role == null || role.isBlank()) {

                    SecurityContextHolder.clearContext();

                    filterChain.doFilter(request, response);
                    return;
                }

                String normalizedRole =
                        role.trim().toUpperCase();

                if (normalizedRole.startsWith("ROLE_")) {
                    normalizedRole =
                            normalizedRole.substring(5);
                }

                /*
                 * Only allow known application roles.
                 */
                if (!normalizedRole.equals("USER")
                        && !normalizedRole.equals("ADMIN")) {

                    SecurityContextHolder.clearContext();

                    filterChain.doFilter(request, response);
                    return;
                }

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(
                                "ROLE_" + normalizedRole
                        );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user.getUsername(),
                                null,
                                List.of(authority)
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
            }

        } catch (Exception e) {

            /*
             * Invalid JWT must never result in an
             * authenticated request.
             */
            SecurityContextHolder.clearContext();

            System.err.println(
                    "JWT authentication failed: "
                            + e.getMessage()
            );
        }

        filterChain.doFilter(request, response);
    }
}