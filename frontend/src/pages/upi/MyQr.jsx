import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import api from "../../services/api";

export default function MyQr() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQr();
  }, []);

  const loadQr = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * Temporary UPI ID.
       * Replace this with the logged-in user's UPI profile
       * once account -> user mapping is available.
       */
      const upiId = localStorage.getItem("upiId");

      if (!upiId) {
        setError(
          "No UPI ID is configured for this user. Create a UPI profile first."
        );
        return;
      }

      const response = await api.get(
        `/upi/qr/${encodeURIComponent(upiId)}`
      );

      setProfile(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Unable to load QR code."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadQr = () => {
    if (!profile?.qrCodeBase64) return;

    const link = document.createElement("a");

    link.href = `data:image/png;base64,${profile.qrCodeBase64}`;
    link.download = `${profile.upiId}-qr.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <QrCode2Icon fontSize="large" />
          <Typography variant="h4" fontWeight={700}>
            My QR Code
          </Typography>
        </Stack>

        <Typography color="text.secondary">
          Let other users scan this QR code to pay your UPI account.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {profile && (
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={5}
              alignItems="center"
            >
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  backgroundColor: "#fff",
                }}
              >
                <img
                  src={`data:image/png;base64,${profile.qrCodeBase64}`}
                  alt={`QR code for ${profile.upiId}`}
                  style={{
                    display: "block",
                    width: 300,
                    height: 300,
                    maxWidth: "100%",
                  }}
                />
              </Box>

              <Stack spacing={2.5} sx={{ flex: 1, width: "100%" }}>
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    UPI ID
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ wordBreak: "break-word" }}
                  >
                    {profile.upiId}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Account Name
                  </Typography>

                  <Typography variant="h6">
                    {profile.displayName}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={downloadQr}
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    py: 1.4,
                    fontWeight: 700,
                  }}
                >
                  Download QR
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
