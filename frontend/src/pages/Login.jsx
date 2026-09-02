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

  /* =========================================================
     MODE
  ========================================================= */

  const [isSignUp, setIsSignUp] = useState(false);

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [rememberUsername, setRememberUsername] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
    confirmPassword: "",
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
    if (loading || isSignUp) {
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
     SWITCH LOGIN / SIGNUP
  ========================================================= */

  const switchMode = () => {
    if (loading) {
      return;
    }

    setIsSignUp((previous) => !previous);

    setError("");
    setSuccess("");

    setFieldErrors({
      username: "",
      password: "",
      confirmPassword: "",
      role: "",
    });

    setForm((previous) => ({
      ...previous,
      password: "",
      confirmPassword: "",
      role: "USER",
    }));
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    const username = form.username.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const role = form.role;

    const errors = {
      username: "",
      password: "",
      confirmPassword: "",
      role: "",
    };

    if (!isSignUp && !role) {
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

    if (isSignUp) {
      if (!confirmPassword) {
        errors.confirmPassword =
          "Please confirm your password.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword =
          "Passwords do not match.";
      }
    }

    setFieldErrors(errors);

    return (
      !errors.username &&
      !errors.password &&
      !errors.confirmPassword &&
      !errors.role
    );
  };

  /* =========================================================
     NORMALIZE ROLE
  ========================================================= */

  const normalizeRole = (role) => {
    return String(role || "")
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, "");
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = async () => {
    const username = form.username.trim();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      const response = await api.post("/auth/login", {
        username,
        password: form.password,
        role: form.role,
      });

      const data = response?.data;

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

      const returnedRole =
        data?.role ||
        data?.user?.role ||
        form.role;

      const normalizedRole =
        normalizeRole(returnedRole);

      if (
        normalizedRole !== "ADMIN" &&
        normalizedRole !== "USER"
      ) {
        throw new Error(
          "Invalid account role returned by the server."
        );
      }

      localStorage.setItem("token", token);

      if (rememberUsername) {
        localStorage.setItem(
          "rememberedUsername",
          username
        );
      } else {
        localStorage.removeItem(
          "rememberedUsername"
        );
      }

      const user = {
        username:
          data?.username ||
          data?.user?.username ||
          username,
        role: normalizedRole,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      setForm((previous) => ({
        ...previous,
        password: "",
        confirmPassword: "",
      }));

      setFieldErrors({
        username: "",
        password: "",
        confirmPassword: "",
        role: "",
      });

      if (normalizedRole === "ADMIN") {
        navigate("/admin", {
          replace: true,
        });
      } else {
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Login failed:", err);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

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
     SIGN UP
  ========================================================= */

  const handleSignUp = async () => {
    const username = form.username.trim();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      /*
       * IMPORTANT:
       * Do NOT send role from the frontend.
       *
       * Backend registration should always
       * create a USER account.
       */

      await api.post("/auth/register", {
        username,
        password: form.password,
      });

      setSuccess(
        "Account created successfully. You can now sign in."
      );

      setForm({
        username,
        password: "",
        confirmPassword: "",
        role: "USER",
      });

      setFieldErrors({
        username: "",
        password: "",
        confirmPassword: "",
        role: "",
      });

      /*
       * Automatically switch back to Sign In
       * after successful registration.
       */
      setTimeout(() => {
        setIsSignUp(false);
        setSuccess(
          "Registration successful. Please sign in."
        );
      }, 1200);
    } catch (err) {
      console.error("Registration failed:", err);

      const status = err?.response?.status;

      let message =
        "Registration failed. Please try again.";

      if (status === 400) {
        message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid registration details.";
      } else if (status === 409) {
        message =
          "Username already exists. Please choose another username.";
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
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (isSignUp) {
      await handleSignUp();
    } else {
      await handleLogin();
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((previous) => !previous);
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
     LOGIN / SIGNUP SCREEN
  ========================================================= */

  return (
    <Box className="login-page">

      {/* BACKGROUND */}

      <Box className="login-background-shape login-shape-one" />

      <Box className="login-background-shape login-shape-two" />

      {/* CARD */}

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
            {isSignUp
              ? "Create your account"
              : "Welcome back"}
          </Typography>

          <Typography className="login-description">
            {isSignUp
              ? "Create a secure account to access your banking services."
              : "Sign in to securely access your banking dashboard."}
          </Typography>

        </Box>

        {/* =================================================
            SUCCESS
        ================================================= */}

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
            ONLY FOR SIGN IN
        ================================================= */}

        {!isSignUp && (
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
                startIcon={
                  <AdminPanelSettingsRounded />
                }
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
        )}

        {/* =================================================
            SIGN UP INFO
        ================================================= */}

        {isSignUp && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            New accounts are registered as User accounts.
          </Alert>
        )}

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
            autoComplete={
              isSignUp
                ? "new-password"
                : "current-password"
            }
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

          {/* CONFIRM PASSWORD */}

          {isSignUp && (
            <TextField
              fullWidth
              label="Confirm password"
              name="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
              placeholder="Re-enter your password"
              className="login-input"
              error={Boolean(
                fieldErrors.confirmPassword
              )}
              helperText={
                fieldErrors.confirmPassword
              }
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
                          toggleConfirmPasswordVisibility
                        }
                        edge="end"
                        disabled={loading}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
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
          )}

          {/* REMEMBER + FORGOT */}

          {!isSignUp && (
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
          )}

          {/* SUBMIT BUTTON */}

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

                {isSignUp
                  ? "Creating account..."
                  : "Signing in..."}
              </>
            ) : (
              isSignUp
                ? "Create account"
                : "Sign in"
            )}

          </Button>

        </Box>

        {/* =================================================
            SWITCH SIGN IN / SIGN UP
        ================================================= */}

        <Box
          sx={{
            textAlign: "center",
            mt: 2.5,
          }}
        >

          <Typography
            component="span"
            sx={{
              fontSize: 13,
              color: "#64748b",
            }}
          >
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}
          </Typography>

          <Button
            type="button"
            onClick={switchMode}
            disabled={loading}
            sx={{
              ml: 0.5,
              p: 0,
              minWidth: "auto",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {isSignUp
              ? "Sign in"
              : "Sign up"}
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