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
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

            /*
             * =====================================================
             * CORS
             * =====================================================
             */
            .cors(cors ->
                cors.configurationSource(
                    corsConfigurationSource()
                )
            )

            /*
             * =====================================================
             * CSRF
             * =====================================================
             *
             * JWT + Stateless API does not require CSRF protection.
             */
            .csrf(csrf -> csrf.disable())

            /*
             * =====================================================
             * SESSION
             * =====================================================
             */
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            /*
             * =====================================================
             * AUTHENTICATION ERROR HANDLER
             * =====================================================
             *
             * Missing/invalid authentication -> HTTP 401.
             * Authenticated user without permission -> HTTP 403.
             */
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(
                    (request, response, authException) ->
                        response.sendError(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized"
                        )
                )
            )

            /*
             * =====================================================
             * AUTHORIZATION
             * =====================================================
             */
            .authorizeHttpRequests(auth -> auth

                /*
                 * -------------------------------------------------
                 * Authentication APIs
                 * -------------------------------------------------
                 */
                .requestMatchers(
                    "/api/auth/**"
                ).permitAll()

                /*
                 * -------------------------------------------------
                 * CORS Preflight
                 * -------------------------------------------------
                 */
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                /*
                 * -------------------------------------------------
                 * Public health/check endpoints if you have them
                 * -------------------------------------------------
                 */
                .requestMatchers(
                    "/actuator/health"
                ).permitAll()

                /*
                 * -------------------------------------------------
                 * UPI PROFILE LOOKUP
                 * -------------------------------------------------
                 *
                 * A logged-in customer can verify another UPI ID.
                 *
                 * This is intentionally authenticated rather than
                 * ADMIN restricted.
                 */
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/upi/profile/**"
                ).authenticated()

                /*
                 * -------------------------------------------------
                 * UPI PAYMENT
                 * -------------------------------------------------
                 *
                 * Payment always requires authentication.
                 */
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/upi/pay"
                ).authenticated()

                /*
                 * -------------------------------------------------
                 * Other UPI APIs
                 * -------------------------------------------------
                 */
                .requestMatchers(
                    "/api/upi/**"
                ).authenticated()

                /*
                 * -------------------------------------------------
                 * ADMIN APIs
                 * -------------------------------------------------
                 */
                .requestMatchers(
                    "/api/admin/**"
                ).hasRole("ADMIN")

                /*
                 * -------------------------------------------------
                 * Everything else under /api
                 * -------------------------------------------------
                 */
                .requestMatchers(
                    "/api/**"
                ).authenticated()

                /*
                 * -------------------------------------------------
                 * Non-API routes
                 * -------------------------------------------------
                 */
                .anyRequest().permitAll()
            )

            /*
             * =====================================================
             * JWT FILTER
             * =====================================================
             */
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    /*
     * =============================================================
     * PASSWORD ENCODER
     * =============================================================
     */
    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    /*
     * =============================================================
     * AUTHENTICATION MANAGER
     * =============================================================
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }

    /*
     * =============================================================
     * CORS CONFIGURATION
     * =============================================================
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        /*
         * Allow all origins for development
         * For production, specify exact origins only
         */
        configuration.setAllowedOrigins(
            List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
                "http://192.168.0.116:5173",
                "http://192.168.0.116:3000"
            )
        );

        /*
         * HTTP methods
         */
        configuration.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
            )
        );

        /*
         * Request headers
         */
        configuration.setAllowedHeaders(
            List.of(
                "*"
            )
        );

        /*
         * Response headers
         */
        configuration.setExposedHeaders(
            List.of(
                "Authorization"
            )
        );

        /*
         * JWT is sent through Authorization header.
         */
        configuration.setAllowCredentials(true);

        /*
         * Register CORS for every endpoint.
         */
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}
