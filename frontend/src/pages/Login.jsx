import { Button, TextField, Paper, Typography, Alert } from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
    setError("");

    try {
      const response = await api.post("/auth/login", {
        username: data.username.trim(),
        password: data.password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const token =
        typeof response.data === "string"
          ? response.data
          : response.data?.token;

      if (!token) {
        setError("Login successful, but JWT token was not received.");
        return;
      }

      localStorage.setItem("token", token);

      console.log("JWT token saved successfully");

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);

      if (err.response) {
        const message =
          err.response.data?.message ||
          `Login failed with status ${err.response.status}`;

        setError(message);
      } else if (err.request) {
        setError(
          "Cannot connect to backend. Please make sure the backend is running."
        );
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 420,
          maxWidth: "100%",
          padding: 4,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Bank Management System
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Secure Banking Portal
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            autoComplete="username"
            {...register("username", {
              required: "Username is required",
            })}
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            autoComplete="current-password"
            {...register("password", {
              required: "Password is required",
            })}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Paper>
    </div>
  );
}
