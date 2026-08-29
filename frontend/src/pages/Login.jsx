import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import {
  AccountBalanceRounded,
  LockRounded,
  PersonRounded,
  Visibility,
  VisibilityOff,
  SecurityRounded,
  CloseRounded,
  AdminPanelSettingsRounded,
  PersonOutlineRounded,
  ArrowBackRounded,
  EmailRounded,
} from "@mui/icons-material";

import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const passwordRef = useRef(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "USER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(true);

  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
    role: "",
  });

  /* =========================================================
     LOAD REMEMBERED USERNAME
  ========================================================= */

  useEffect(() => {
    const rememberedUsername =
      localStorage.getItem("rememberedUsername");

    if (rememberedUsername) {
      setForm((previous) => ({
        ...previous,
        username: rememberedUsername,
      }));
    }
  }, []);

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  /* =========================================================
     SELECT ROLE
  ========================================================= */

  const handleRoleChange = (role) => {
    if (loading) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      role,
    }));

    setError("");
    setSuccess("");

    setFieldErrors((previous) => ({
      ...previous,
      role: "",
    }));
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    const username = form.username.trim();
    const password = form.password;
    const role = form.role;

    const errors = {
      username: "",
      password: "",
      role: "",
    };

    if (!role) {
      errors.role = "Please select account type.";
    }

    if (!username) {
      errors.username = "Username is required.";
    } else if (username.length < 3) {
      errors.username =
        "Username must contain at least 3 characters.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password =
        "Password must contain at least 6 characters.";
    }

    setFieldErrors(errors);

    return (
      !errors.username &&
      !errors.password &&
      !errors.role
    );
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const username = form.username.trim();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      /*
       * Remove stale authentication data before
       * starting a fresh login.
       */
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      /*
       * IMPORTANT:
       * Send the selected role to the backend.
       */
      const response = await api.post("/auth/login", {
        username,
        password: form.password,
        role: form.role,
      });

      const data = response?.data;

      /*
       * Support multiple possible backend response names.
       */
      const token =
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        data?.access_token;

      if (!token) {
        throw new Error(
          "Authentication token was not returned by the server."
        );
      }

      /* =====================================================
         SAVE TOKEN
      ===================================================== */

      localStorage.setItem("token", token);

      /* =====================================================
         SAVE USERNAME
      ===================================================== */

      if (rememberUsername) {
        localStorage.setItem(
          "rememberedUsername",
          username
        );
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      /* =====================================================
         USER INFORMATION
      ===================================================== */

      const returnedRole =
        data?.role ||
        data?.user?.role ||
        form.role;

      const user = {
        username:
          data?.username ||
          data?.user?.username ||
          username,

        role: returnedRole,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      /*
       * Clear password from React state.
       */
      setForm((previous) => ({
        ...previous,
        password: "",
      }));

      /*
       * Navigate to dashboard.
       */
      navigate("/dashboard", {
        replace: true,
      });

    } catch (err) {
      console.error("Login failed:", err);

      /*
       * Remove potentially invalid authentication data.
       */
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const status = err?.response?.status;

      let message =
        "Login failed. Please check your credentials.";

      if (status === 401) {
        message =
          "Invalid username or password.";

      } else if (status === 403) {
        message =
          "Access denied. Your account may not have permission to log in.";

      } else if (status === 400) {
        message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid login request.";

      } else if (!err?.response) {
        message =
          "Unable to connect to the banking server. Please check that the backend is running.";

      } else {
        const serverMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error;

        if (typeof serverMessage === "string") {
          message = serverMessage;
        }
      }

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CLEAR USERNAME
  ========================================================= */

  const clearUsername = () => {
    setForm((previous) => ({
      ...previous,
      username: "",
    }));

    setFieldErrors((previous) => ({
      ...previous,
      username: "",
    }));

    setError("");
  };

  /* =========================================================
     PASSWORD VISIBILITY
  ========================================================= */

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  const handleForgotPassword = () => {
    setForgotPassword(true);
    setError("");
    setSuccess("");
  };

  const handleBackToLogin = () => {
    setForgotPassword(false);
    setError("");
    setSuccess("");
  };

  /* =========================================================
     FORGOT PASSWORD SCREEN
  ========================================================= */

  if (forgotPassword) {
    return (
      <Box className="login-page">

        <Box className="login-background-shape login-shape-one" />

        <Box className="login-background-shape login-shape-two" />

        <Paper
          elevation={0}
          className="login-card"
          component="main"
        >

          {/* BRAND */}

          <Box className="login-brand">

            <Box className="login-brand-icon">
              <AccountBalanceRounded />
            </Box>

            <Typography className="login-brand-name">
              SecureBank
            </Typography>

            <Typography className="login-brand-subtitle">
              Banking Management System
            </Typography>

          </Box>

          {/* HEADING */}

          <Box className="login-heading">

            <Typography className="login-title">
              Forgot password?
            </Typography>

            <Typography className="login-description">
              Enter your registered email address and we
              will help you reset your password.
            </Typography>

          </Box>

          {/* SUCCESS */}

          {success && (
            <Alert
              severity="success"
              className="login-alert"
              onClose={() => setSuccess("")}
              sx={{ mb: 2 }}
            >
              {success}
            </Alert>
          )}

          {/* ERROR */}

          {error && (
            <Alert
              severity="error"
              className="login-alert"
              onClose={() => setError("")}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* FORM */}

          <Box
            component="form"
            className="login-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();

              setError("");
              setSuccess(
                "Password reset functionality will be connected to the backend next."
              );
            }}
          >

            <TextField
              fullWidth
              label="Registered email"
              type="email"
              placeholder="Enter your registered email"
              autoComplete="email"
              disabled={loading}
              className="login-input"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRounded className="login-input-icon" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              className="login-button"
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {loading ? (
                <>
                  <CircularProgress
                    size={20}
                    thickness={5}
                    color="inherit"
                    sx={{ mr: 1 }}
                  />

                  Sending...
                </>
              ) : (
                "Send reset instructions"
              )}
            </Button>

            <Button
              type="button"
              fullWidth
              variant="text"
              startIcon={<ArrowBackRounded />}
              onClick={handleBackToLogin}
              disabled={loading}
              sx={{
                minHeight: 44,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Back to login
            </Button>

          </Box>

          {/* SECURITY */}

          <Box className="login-security">

            <SecurityRounded />

            <Typography>
              Your connection and account information are
              protected.
            </Typography>

          </Box>

          <Typography className="login-footer">
            SecureBank Management System
          </Typography>

        </Paper>

      </Box>
    );
  }

  /* =========================================================
     LOGIN SCREEN
  ========================================================= */

  return (
    <Box className="login-page">

      {/* Background decoration */}

      <Box className="login-background-shape login-shape-one" />

      <Box className="login-background-shape login-shape-two" />

      {/* Login Card */}

      <Paper
        elevation={0}
        className="login-card"
        component="main"
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <Box className="login-brand">

          <Box className="login-brand-icon">
            <AccountBalanceRounded />
          </Box>

          <Typography className="login-brand-name">
            SecureBank
          </Typography>

          <Typography className="login-brand-subtitle">
            Banking Management System
          </Typography>

        </Box>

        {/* =================================================
            HEADING
        ================================================= */}

        <Box className="login-heading">

          <Typography className="login-title">
            Welcome back
          </Typography>

          <Typography className="login-description">
            Sign in to securely access your banking dashboard.
          </Typography>

        </Box>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            className="login-alert"
            onClose={() => setError("")}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* =================================================
            ACCOUNT TYPE
        ================================================= */}

        <Box sx={{ mb: 2.5 }}>

          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "#475569",
              mb: 1,
            }}
          >
            Sign in as
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
            }}
          >

            {/* USER */}

            <Button
              type="button"
              disabled={loading}
              onClick={() =>
                handleRoleChange("USER")
              }
              variant={
                form.role === "USER"
                  ? "contained"
                  : "outlined"
              }
              startIcon={<PersonOutlineRounded />}
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              User
            </Button>

            {/* ADMIN */}

            <Button
              type="button"
              disabled={loading}
              onClick={() =>
                handleRoleChange("ADMIN")
              }
              variant={
                form.role === "ADMIN"
                  ? "contained"
                  : "outlined"
              }
              startIcon={<AdminPanelSettingsRounded />}
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Admin
            </Button>

          </Box>

          {fieldErrors.role && (
            <Typography
              sx={{
                color: "error.main",
                fontSize: 12,
                mt: 0.75,
                ml: 1.5,
              }}
            >
              {fieldErrors.role}
            </Typography>
          )}

        </Box>

        {/* =================================================
            FORM
        ================================================= */}

        <Box
          component="form"
          onSubmit={handleSubmit}
          className="login-form"
          noValidate
        >

          {/* USERNAME */}

          <TextField
            fullWidth
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            autoFocus
            disabled={loading}
            placeholder="Enter your username"
            className="login-input"
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrors.username}
            slotProps={{
              input: {

                startAdornment: (
                  <InputAdornment position="start">
                    <PersonRounded className="login-input-icon" />
                  </InputAdornment>
                ),

                endAdornment: form.username ? (
                  <InputAdornment position="end">

                    <IconButton
                      onClick={clearUsername}
                      disabled={loading}
                      edge="end"
                      size="small"
                      aria-label="Clear username"
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>

                  </InputAdornment>
                ) : null,

              },
            }}
          />

          {/* PASSWORD */}

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            disabled={loading}
            placeholder="Enter your password"
            className="login-input"
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password}
            inputRef={passwordRef}
            slotProps={{
              input: {

                startAdornment: (
                  <InputAdornment position="start">
                    <LockRounded className="login-input-icon" />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">

                    <IconButton
                      onClick={
                        togglePasswordVisibility
                      }
                      edge="end"
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>

                  </InputAdornment>
                ),

              },
            }}
          />

          {/* REMEMBER + FORGOT */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: -0.5,
              mb: 1,
            }}
          >

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberUsername}
                  onChange={(event) =>
                    setRememberUsername(
                      event.target.checked
                    )
                  }
                  disabled={loading}
                  size="small"
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  Remember username
                </Typography>
              }
            />

            <Button
              type="button"
              variant="text"
              onClick={handleForgotPassword}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                minWidth: "auto",
                px: 0.5,
              }}
            >
              Forgot password?
            </Button>

          </Box>

          {/* LOGIN BUTTON */}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            className="login-button"
            sx={{
              minHeight: 48,
              textTransform: "none",
              fontSize: 15,
              fontWeight: 700,
            }}
          >

            {loading ? (
              <>
                <CircularProgress
                  size={20}
                  thickness={5}
                  color="inherit"
                  sx={{ mr: 1 }}
                />

                Signing in...
              </>
            ) : (
              "Sign in"
            )}

          </Button>

        </Box>

        {/* =================================================
            SECURITY
        ================================================= */}

        <Box className="login-security">

          <SecurityRounded />

          <Typography>
            Your connection and account information are
            protected.
          </Typography>

        </Box>

        {/* =================================================
            FOOTER
        ================================================= */}

        <Typography className="login-footer">
          SecureBank Management System
        </Typography>

      </Paper>

    </Box>
  );
}
