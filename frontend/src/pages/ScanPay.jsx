import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedIcon from "@mui/icons-material/Verified";
import SecurityIcon from "@mui/icons-material/Security";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

import { Html5Qrcode } from "html5-qrcode";

import api from "../services/api";
import "../styles/ScanPay.css";

function extractUpiData(value) {
  if (!value) {
    return {
      upiId: "",
      name: "",
      amount: "",
      note: "",
    };
  }

  const text = value.trim();

  // Direct UPI ID
  if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(text)) {
    return {
      upiId: text,
      name: "",
      amount: "",
      note: "",
    };
  }

  try {
    if (text.toLowerCase().startsWith("upi://")) {
      const url = new URL(text);

      return {
        upiId: url.searchParams.get("pa") || "",
        name: url.searchParams.get("pn") || "",
        amount: url.searchParams.get("am") || "",
        note: url.searchParams.get("tn") || "",
      };
    }
  } catch {
    return {
      upiId: "",
      name: "",
      amount: "",
      note: "",
    };
  }

  return {
    upiId: "",
    name: "",
    amount: "",
    note: "",
  };
}

function isValidUpiId(value) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(value.trim());
}

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ScanPay() {
  const scannerRef = useRef(null);
  const qrRef = useRef(null);

  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [receiverUpiId, setReceiverUpiId] = useState("");
  const [receiver, setReceiver] = useState(null);

  const [senderUpiId, setSenderUpiId] = useState(
    localStorage.getItem("upiId") || ""
  );

  const [amount, setAmount] = useState("");
  const [qrAmount, setQrAmount] = useState("");

  const [loadingReceiver, setLoadingReceiver] = useState(false);
  const [paying, setPaying] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  const showSnackbar = (message) => {
    setSnackbar({
      open: true,
      message,
    });
  };

  const closeSnackbar = () => {
    setSnackbar({
      open: false,
      message: "",
    });
  };

  /*
   * ------------------------------------------------------------
   * QR VALUE
   * ------------------------------------------------------------
   */

  const qrValue = senderUpiId.trim()
    ? `upi://pay?pa=${encodeURIComponent(
        senderUpiId.trim()
      )}&pn=${encodeURIComponent("Bank Customer")}${
        qrAmount && Number(qrAmount) > 0
          ? `&am=${encodeURIComponent(Number(qrAmount).toFixed(2))}`
          : ""
      }&cu=INR`
    : "";

  /*
   * ------------------------------------------------------------
   * STOP SCANNER
   * ------------------------------------------------------------
   */

  const stopScanner = useCallback(async () => {
    const activeScanner = scannerRef.current;

    if (!activeScanner) {
      setScanning(false);
      setScanner(null);
      return;
    }

    try {
      const state = activeScanner.getState();

      // Html5Qrcode scanner state 2 = SCANNING
      if (state === 2) {
        await activeScanner.stop();
      }

      await activeScanner.clear();
    } catch {
      // Scanner may already be stopped.
    }

    scannerRef.current = null;
    setScanner(null);
    setScanning(false);
  }, []);

  /*
   * ------------------------------------------------------------
   * FIND RECEIVER
   * ------------------------------------------------------------
   */

  const findReceiver = useCallback(
    async (upiId = receiverUpiId) => {
      const cleanUpiId = upiId.trim();

      if (!cleanUpiId) {
        setError("Enter or scan a receiver UPI ID.");
        return;
      }

      if (!isValidUpiId(cleanUpiId)) {
        setError("Enter a valid UPI ID, for example user@bank.");
        return;
      }

      if (
        senderUpiId.trim() &&
        cleanUpiId.toLowerCase() === senderUpiId.trim().toLowerCase()
      ) {
        setError("Sender and receiver UPI IDs cannot be the same.");
        return;
      }

      setLoadingReceiver(true);
      setError("");
      setMessage("");
      setReceiver(null);

      try {
        const response = await api.get(
          `/upi/profile/${encodeURIComponent(cleanUpiId)}`
        );

        setReceiver(response.data);
        setMessage("Receiver verified successfully.");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            "Receiver UPI profile not found."
        );
      } finally {
        setLoadingReceiver(false);
      }
    },
    [receiverUpiId, senderUpiId]
  );

  /*
   * ------------------------------------------------------------
   * QR SCANNER
   * ------------------------------------------------------------
   */

  const handleQrResult = useCallback(
    async (decodedText) => {
      const data = extractUpiData(decodedText);

      if (!data.upiId) {
        setError(
          "The scanned QR does not contain a valid UPI payment address."
        );
        return;
      }

      setReceiverUpiId(data.upiId);

      if (data.amount && Number(data.amount) > 0) {
        setAmount(data.amount);
      }

      setMessage("UPI QR scanned successfully.");

      await stopScanner();

      await findReceiver(data.upiId);
    },
    [findReceiver, stopScanner]
  );

  const startScanner = async () => {
    if (scanning) {
      return;
    }

    setError("");
    setMessage("");
    setPaymentResult(null);

    try {
      const existingElement = document.getElementById("upi-qr-reader");

      if (!existingElement) {
        throw new Error("QR scanner container was not found.");
      }

      const qrScanner = new Html5Qrcode("upi-qr-reader");

      scannerRef.current = qrScanner;

      await qrScanner.start(
        {
          facingMode: {
            ideal: "environment",
          },
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          await handleQrResult(decodedText);
        },
        () => {
          // Ignore continuous QR frame errors.
        }
      );

      setScanner(qrScanner);
      setScanning(true);
    } catch (err) {
      scannerRef.current = null;

      setError(
        err?.message?.toLowerCase().includes("permission")
          ? "Camera permission was denied. Please allow camera access and try again."
          : err?.message ||
              "Unable to access the camera. Please check your browser permissions."
      );

      setScanning(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * PAYMENT
   * ------------------------------------------------------------
   */

  const makePayment = async () => {
    setError("");
    setMessage("");
    setPaymentResult(null);

    const cleanSender = senderUpiId.trim();
    const cleanReceiver = receiver?.upiId?.trim();

    if (!cleanSender) {
      setError("Enter your sender UPI ID.");
      return;
    }

    if (!isValidUpiId(cleanSender)) {
      setError("Enter a valid sender UPI ID.");
      return;
    }

    if (!cleanReceiver) {
      setError("Verify the receiver UPI ID first.");
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    if (numericAmount > 1000000) {
      setError("Payment amount cannot exceed ₹10,00,000.");
      return;
    }

    if (cleanSender.toLowerCase() === cleanReceiver.toLowerCase()) {
      setError("Sender and receiver UPI IDs cannot be the same.");
      return;
    }

    setPaying(true);

    try {
      const response = await api.post("/upi/pay", {
        senderUpiId: cleanSender,
        receiverUpiId: cleanReceiver,
        amount: numericAmount,
      });

      setPaymentResult(response.data);
      setMessage("Payment completed successfully.");
      setAmount("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "UPI payment failed. Please try again."
      );
    } finally {
      setPaying(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * COPY UPI ID
   * ------------------------------------------------------------
   */

  const copyUpiId = async () => {
    if (!senderUpiId.trim()) {
      showSnackbar("No UPI ID available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(senderUpiId.trim());
      showSnackbar("UPI ID copied to clipboard.");
    } catch {
      showSnackbar("Unable to copy UPI ID.");
    }
  };

  /*
   * ------------------------------------------------------------
   * SHARE UPI
   * ------------------------------------------------------------
   */

  const shareUpi = async () => {
    if (!senderUpiId.trim()) {
      showSnackbar("No UPI ID available to share.");
      return;
    }

    const shareData = {
      title: "My UPI ID",
      text: `Pay me on UPI: ${senderUpiId.trim()}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `Pay me on UPI: ${senderUpiId.trim()}`
        );

        showSnackbar("UPI payment information copied.");
      }
    } catch {
      // User cancelled native share.
    }
  };

  /*
   * ------------------------------------------------------------
   * DOWNLOAD QR
   * ------------------------------------------------------------
   */

  const downloadQr = () => {
    if (!qrRef.current || !senderUpiId.trim()) {
      showSnackbar("Generate your UPI QR first.");
      return;
    }

    const svg = qrRef.current.querySelector("svg");

    if (!svg) {
      showSnackbar("QR code is not ready yet.");
      return;
    }

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const svgBlob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 800;
      canvas.height = 800;

      const context = canvas.getContext("2d");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.drawImage(
        image,
        50,
        50,
        700,
        700
      );

      URL.revokeObjectURL(url);

      const link = document.createElement("a");

      link.download = "my-upi-qr.png";
      link.href = canvas.toDataURL("image/png");

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSnackbar("UPI QR downloaded.");
    };

    image.src = url;
  };

  /*
   * ------------------------------------------------------------
   * RESET
   * ------------------------------------------------------------
   */

  const resetPayment = () => {
    setReceiverUpiId("");
    setReceiver(null);
    setAmount("");
    setPaymentResult(null);
    setError("");
    setMessage("");
  };

  /*
   * ------------------------------------------------------------
   * CLEANUP
   * ------------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      const activeScanner = scannerRef.current;

      if (activeScanner) {
        activeScanner
          .stop()
          .catch(() => {})
          .finally(() => {
            activeScanner.clear().catch(() => {});
          });
      }
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <Box className="scan-pay-page">

      {/* HEADER */}
      <Box className="scan-pay-header">

        <Box>
          <Typography className="scan-pay-eyebrow">
            DIGITAL PAYMENTS
          </Typography>

          <Typography className="scan-pay-title">
            Scan & Pay
          </Typography>

          <Typography className="scan-pay-subtitle">
            Scan a UPI QR code, verify the recipient, and complete
            the payment securely.
          </Typography>
        </Box>

        <Box className="scan-pay-header-badge">
          <QrCode2Icon />
          <Typography>
            UPI
          </Typography>
        </Box>

      </Box>

      {/* SECURITY BAR */}
      <Card className="security-banner">
        <Box className="security-icon">
          <SecurityIcon />
        </Box>

        <Box>
          <Typography className="security-title">
            Secure UPI Payments
          </Typography>

          <Typography className="security-text">
            Always verify the recipient details before confirming
            a payment.
          </Typography>
        </Box>

        <Chip
          icon={<VerifiedIcon />}
          label="Protected"
          className="protected-chip"
        />
      </Card>

      {/* GLOBAL ALERTS */}
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

      {/* MAIN GRID */}
      <Box className="scan-pay-grid">

        {/* LEFT */}
        <Box className="scan-pay-left">

          {/* MY QR */}
          <Card className="scan-pay-card my-qr-card">

            <CardContent>

              <Box className="card-heading-row">

                <Box>
                  <Typography className="section-eyebrow">
                    RECEIVE MONEY
                  </Typography>

                  <Typography className="section-title">
                    My UPI QR Code
                  </Typography>

                  <Typography className="section-description">
                    Let another person scan this QR code to pay
                    you instantly.
                  </Typography>
                </Box>

                <Box className="section-icon-box">
                  <QrCode2Icon />
                </Box>

              </Box>

              <Divider sx={{ my: 3 }} />

              {!senderUpiId.trim() ? (
                <Alert severity="warning">
                  Your UPI ID is not available. Enter your UPI ID
                  in Payment Details to generate your QR code.
                </Alert>
              ) : (
                <>
                  <Box className="qr-display-area">

                    <Box
                      ref={qrRef}
                      className="generated-qr-wrapper"
                    >
                      <QRCodeSVG
                        value={qrValue}
                        size={230}
                        level="H"
                        includeMargin
                      />
                    </Box>

                    <Typography className="qr-upi-id">
                      {senderUpiId}
                    </Typography>

                    <Typography className="qr-helper-text">
                      Scan this code using any compatible UPI app
                    </Typography>

                  </Box>

                  {/* QR OPTIONS */}
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1.5}
                    className="qr-actions"
                  >

                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={copyUpiId}
                      fullWidth
                    >
                      Copy UPI ID
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={downloadQr}
                      fullWidth
                    >
                      Download QR
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={shareUpi}
                      fullWidth
                    >
                      Share
                    </Button>

                  </Stack>

                  {/* OPTIONAL FIXED AMOUNT */}
                  <Box className="qr-amount-box">

                    <Typography className="qr-amount-title">
                      Create QR with amount
                    </Typography>

                    <Typography className="qr-amount-description">
                      Optional. Leave empty if the payer should
                      enter the amount.
                    </Typography>

                    <TextField
                      value={qrAmount}
                      onChange={(event) =>
                        setQrAmount(event.target.value)
                      }
                      type="number"
                      placeholder="Optional amount"
                      fullWidth
                      size="small"
                      inputProps={{
                        min: 0.01,
                        step: 0.01,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mt: 1.5 }}
                    />

                  </Box>
                </>
              )}

            </CardContent>
          </Card>

          {/* SCANNER */}
          <Card className="scan-pay-card scanner-card">

            <CardContent>

              <Box className="card-heading-row">

                <Box>
                  <Typography className="section-eyebrow">
                    SEND MONEY
                  </Typography>

                  <Typography className="section-title">
                    Scan QR Code
                  </Typography>

                  <Typography className="section-description">
                    Point your camera at the recipient's UPI QR
                    code.
                  </Typography>
                </Box>

                <Box className="section-icon-box">
                  <QrCodeScannerIcon />
                </Box>

              </Box>

              <Divider sx={{ my: 3 }} />

              <Box
                id="upi-qr-reader"
                className={`qr-reader ${
                  scanning ? "qr-reader-active" : ""
                }`}
              >

                {!scanning && (
                  <Box className="scanner-placeholder">

                    <Box className="scanner-placeholder-icon">
                      <CameraAltIcon />
                    </Box>

                    <Typography className="scanner-placeholder-title">
                      Camera scanner ready
                    </Typography>

                    <Typography className="scanner-placeholder-text">
                      Click “Scan QR” and allow camera access
                      when prompted.
                    </Typography>

                  </Box>
                )}

              </Box>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
                sx={{ mt: 3 }}
              >

                {!scanning ? (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={startScanner}
                  >
                    Scan QR
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<StopCircleOutlinedIcon />}
                    onClick={stopScanner}
                  >
                    Stop Scanner
                  </Button>
                )}

              </Stack>

            </CardContent>
          </Card>

        </Box>

        {/* RIGHT */}
        <Card className="scan-pay-card payment-card">

          <CardContent>

            <Box className="card-heading-row">

              <Box>
                <Typography className="section-eyebrow">
                  PAYMENT
                </Typography>

                <Typography className="section-title">
                  Payment Details
                </Typography>

                <Typography className="section-description">
                  Verify the recipient before sending money.
                </Typography>
              </Box>

              <Box className="section-icon-box">
                <PaymentsIcon />
              </Box>

            </Box>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={2.5}>

              {/* SENDER */}
              <TextField
                label="Your UPI ID"
                value={senderUpiId}
                onChange={(event) => {
                  const value = event.target.value;

                  setSenderUpiId(value);

                  if (value.trim()) {
                    localStorage.setItem(
                      "upiId",
                      value.trim()
                    );
                  }
                }}
                fullWidth
                helperText={
                  senderUpiId
                    ? "This UPI ID will be used for payment."
                    : "Enter your UPI ID to generate your QR."
                }
                InputProps={{
                  endAdornment: senderUpiId && (
                    <InputAdornment position="end">
                      <Tooltip title="Verified UPI ID">
                        <VerifiedIcon color="success" />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

              {/* RECEIVER */}
              <TextField
                label="Receiver UPI ID"
                value={receiverUpiId}
                onChange={(event) => {
                  setReceiverUpiId(event.target.value);
                  setReceiver(null);
                  setError("");
                }}
                placeholder="example@bank"
                fullWidth
              />

              {/* VERIFY */}
              <Button
                variant="outlined"
                size="large"
                onClick={() => findReceiver()}
                disabled={
                  loadingReceiver ||
                  !receiverUpiId.trim()
                }
                startIcon={
                  loadingReceiver ? (
                    <CircularProgress size={20} />
                  ) : (
                    <VerifiedIcon />
                  )
                }
              >
                {loadingReceiver
                  ? "Verifying..."
                  : "Verify Receiver"}
              </Button>

              {/* RECEIVER CARD */}
              {receiver && (
                <Box className="receiver-box">

                  <Box className="receiver-top">

                    <Box className="receiver-avatar">
                      {receiver.displayName
                        ?.charAt(0)
                        ?.toUpperCase() || "U"}
                    </Box>

                    <Box>
                      <Typography className="receiver-label">
                        VERIFIED RECEIVER
                      </Typography>

                      <Typography className="receiver-name">
                        {receiver.displayName ||
                          "Verified User"}
                      </Typography>

                      <Typography className="receiver-upi">
                        {receiver.upiId}
                      </Typography>
                    </Box>

                    <VerifiedIcon
                      className="receiver-verified-icon"
                    />

                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box className="receiver-account-row">

                    <AccountBalanceIcon />

                    <Box>
                      <Typography className="receiver-account-label">
                        Bank Account
                      </Typography>

                      <Typography className="receiver-account">
                        {receiver.accountId ||
                          "Account verified"}
                      </Typography>
                    </Box>

                  </Box>

                </Box>
              )}

              {/* AMOUNT */}
              <TextField
                label="Amount"
                value={amount}
                onChange={(event) => {
                  const value = event.target.value;

                  if (Number(value) >= 0 || value === "") {
                    setAmount(value);
                  }
                }}
                type="number"
                fullWidth
                inputProps={{
                  min: 0.01,
                  max: 1000000,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      ₹
                    </InputAdornment>
                  ),
                }}
              />

              {/* PAYMENT SUMMARY */}
              {receiver && amount && Number(amount) > 0 && (
                <Box className="payment-summary">

                  <Typography className="summary-title">
                    Payment Summary
                  </Typography>

                  <Box className="summary-row">
                    <Typography>
                      To
                    </Typography>

                    <Typography className="summary-value">
                      {receiver.displayName ||
                        receiver.upiId}
                    </Typography>
                  </Box>

                  <Box className="summary-row">
                    <Typography>
                      UPI ID
                    </Typography>

                    <Typography className="summary-value">
                      {receiver.upiId}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box className="summary-total">
                    <Typography>
                      Total
                    </Typography>

                    <Typography>
                      ₹{formatAmount(amount)}
                    </Typography>
                  </Box>

                </Box>
              )}

              {/* PAY */}
              <Button
                variant="contained"
                size="large"
                disabled={
                  !receiver ||
                  !amount ||
                  Number(amount) <= 0 ||
                  paying
                }
                onClick={makePayment}
                className="pay-button"
                endIcon={
                  !paying && <ArrowForwardIcon />
                }
              >
                {paying ? (
                  <>
                    <CircularProgress
                      size={22}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    Processing Payment...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>

              {/* RESET */}
              {(receiver || paymentResult) && (
                <Button
                  variant="text"
                  startIcon={<RefreshIcon />}
                  onClick={resetPayment}
                >
                  Start New Payment
                </Button>
              )}

            </Stack>

          </CardContent>
        </Card>

      </Box>

      {/* SUCCESS */}
      {paymentResult && (
        <Card className="payment-success-card">

          <CardContent>

            <Box className="success-header">

              <Box className="success-icon">
                <CheckCircleOutlineIcon />
              </Box>

              <Box>
                <Typography className="success-title">
                  Payment Successful
                </Typography>

                <Typography className="success-subtitle">
                  Your UPI payment has been completed
                  successfully.
                </Typography>
              </Box>

            </Box>

            <Divider sx={{ my: 3 }} />

            <Box className="success-amount">
              ₹{formatAmount(paymentResult.amount)}
            </Box>

            <Typography className="success-recipient">
              Sent to{" "}
              <strong>
                {paymentResult.receiverUpiId}
              </strong>
            </Typography>

            <Box className="success-details">

              <Box>
                <Typography>
                  Status
                </Typography>

                <Chip
                  label={
                    paymentResult.status || "SUCCESS"
                  }
                  color="success"
                  size="small"
                />
              </Box>

              <Box>
                <Typography>
                  Sender
                </Typography>

                <strong>
                  {paymentResult.senderUpiId}
                </strong>
              </Box>

              <Box>
                <Typography>
                  Receiver
                </Typography>

                <strong>
                  {paymentResult.receiverUpiId}
                </strong>
              </Box>

              {paymentResult.transactionId && (
                <Box>
                  <Typography>
                    Transaction ID
                  </Typography>

                  <strong>
                    {paymentResult.transactionId}
                  </strong>
                </Box>
              )}

            </Box>

          </CardContent>
        </Card>
      )}

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={closeSnackbar}
        message={snackbar.message}
      />

    </Box>
  );
}