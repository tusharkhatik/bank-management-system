package com.bank.bankmanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                // =====================================================
                // CORS
                // =====================================================
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // =====================================================
                // CSRF
                // =====================================================
                .csrf(csrf -> csrf.disable())

                // =====================================================
                // SESSION
                // =====================================================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // =====================================================
                // EXCEPTION HANDLING
                // =====================================================
                .exceptionHandling(exception -> exception

                        .authenticationEntryPoint(
                                (request, response, authException) -> {

                                    response.setStatus(
                                            HttpStatus.UNAUTHORIZED.value()
                                    );

                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"Unauthorized\"}"
                                    );
                                }
                        )

                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {

                                    response.setStatus(
                                            HttpStatus.FORBIDDEN.value()
                                    );

                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"Access denied\"}"
                                    );
                                }
                        )
                )

                // =====================================================
                // AUTHORIZATION
                // =====================================================
                .authorizeHttpRequests(auth -> auth

                        // Authentication
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        // CORS preflight
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Health
                        .requestMatchers(
                                "/actuator/health"
                        ).permitAll()

                        // ADMIN
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // TRANSACTIONS
                        .requestMatchers(
                                "/api/transactions/**"
                        ).authenticated()

                        // UPI
                        .requestMatchers(
                                "/api/upi/**"
                        ).authenticated()

                        // ACCOUNTS
                        .requestMatchers(
                                "/api/accounts/**"
                        ).authenticated()

                        // Remaining APIs
                        .requestMatchers(
                                "/api/**"
                        ).authenticated()

                        .anyRequest().permitAll()
                )

                // =====================================================
                // JWT FILTER
                // =====================================================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // =============================================================
    // PASSWORD ENCODER
    // =============================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =============================================================
    // AUTHENTICATION MANAGER
    // =============================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    // =============================================================
    // CORS
    // =============================================================

  @Bean
public CorsConfigurationSource corsConfigurationSource() {

    CorsConfiguration configuration = new CorsConfiguration();

    configuration.setAllowedOriginPatterns(
            List.of(
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "http://192.168.*.*:*"
            )
    );

    configuration.setAllowedMethods(
            List.of(
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS"
            )
    );

    configuration.setAllowedHeaders(
            List.of("*")
    );

    configuration.setExposedHeaders(
            List.of("Authorization")
    );

    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

    source.registerCorsConfiguration(
            "/**",
            configuration
    );

    return source;
}
}