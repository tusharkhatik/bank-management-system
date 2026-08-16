import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";
import "../styles/UPI.css";

export default function UPI() {
  const [form, setForm] = useState({
    upiId: "",
    displayName: "",
    accountId: "",
  });

  const [searchUpiId, setSearchUpiId] = useState("");
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const createProfile = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setProfile(null);
    setLoading(true);

    try {
      const response = await api.post("/upi/profile", {
        upiId: form.upiId.trim(),
        displayName: form.displayName.trim(),
        accountId: Number(form.accountId),
      });

      setProfile(response.data);
      setMessage("UPI profile created successfully.");

      setForm({
        upiId: "",
        displayName: "",
        accountId: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Unable to create UPI profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const findProfile = async () => {
    if (!searchUpiId.trim()) {
      setError("Enter a UPI ID.");
      return;
    }

    setMessage("");
    setError("");
    setProfile(null);
    setLoading(true);

    try {
      const response = await api.get(
        `/upi/profile/${encodeURIComponent(searchUpiId.trim())}`
      );

      setProfile(response.data);
      setMessage("UPI profile found.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "UPI profile not found."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="upi-page">
      <Box className="upi-header">
        <Box>
          <Typography className="upi-eyebrow">
            DIGITAL PAYMENTS
          </Typography>

          <Typography className="upi-title">
            UPI Management
          </Typography>

          <Typography className="upi-subtitle">
            Create and manage UPI profiles linked to customer accounts.
          </Typography>
        </Box>

        <Chip
          label="UPI ACTIVE"
          color="success"
          variant="outlined"
        />
      </Box>

      {message && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card className="upi-card">
            <CardContent>
              <Typography className="upi-card-title">
                Create UPI Profile
              </Typography>

              <Typography className="upi-card-description">
                Link a unique UPI ID with an existing bank account.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Box component="form" onSubmit={createProfile}>
                <Stack spacing={2.5}>
                  <TextField
                    label="UPI ID"
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    placeholder="example@bank"
                    fullWidth
                    required
                  />

                  <TextField
                    label="Display Name"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    placeholder="Tushar Khatik"
                    fullWidth
                    required
                  />

                  <TextField
                    label="Account ID"
                    name="accountId"
                    value={form.accountId}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    className="upi-primary-button"
                  >
                    {loading ? "Creating..." : "Create UPI Profile"}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card className="upi-card upi-search-card">
            <CardContent>
              <Typography className="upi-card-title">
                Find UPI Profile
              </Typography>

              <Typography className="upi-card-description">
                Search an existing profile using its UPI ID.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2}>
                <TextField
                  label="UPI ID"
                  value={searchUpiId}
                  onChange={(event) =>
                    setSearchUpiId(event.target.value)
                  }
                  placeholder="example@bank"
                  fullWidth
                />

                <Button
                  variant="outlined"
                  size="large"
                  onClick={findProfile}
                  disabled={loading}
                >
                  Search UPI
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {profile && (
            <Card className="upi-profile-card">
              <CardContent>
                <Typography className="profile-label">
                  UPI PROFILE
                </Typography>

                <Typography className="profile-upi-id">
                  {profile.upiId}
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 3 }}>
                  <Box className="profile-row">
                    <span>Name</span>
                    <strong>{profile.displayName}</strong>
                  </Box>

                  <Box className="profile-row">
                    <span>Account ID</span>
                    <strong>{profile.accountId}</strong>
                  </Box>

                  <Box className="profile-row">
                    <span>Status</span>
                    <Chip
                      size="small"
                      label={profile.active ? "Active" : "Inactive"}
                      color={profile.active ? "success" : "default"}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
