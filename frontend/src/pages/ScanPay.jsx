import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
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
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import api from "../services/api";
import "../styles/ScanPay.css";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PAYMENT_AMOUNT = 1000000;
const MAX_QR_AMOUNT = 1000000;

const UPI_REGEX =
  /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

/* ============================================================
   HELPERS
============================================================ */

function getApiErrorMessage(
  error,
  fallback = "Something went wrong."
) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 400) {
    return (
      data?.message ||
      data?.error ||
      "Invalid payment request."
    );
  }

  if (status === 401) {
    return "Your session has expired. Please login again.";
  }

  if (status === 403) {
    return "You are not authorized to perform this operation.";
  }

  if (status === 404) {
    return (
      data?.message ||
      data?.error ||
      "UPI profile was not found."
    );
  }

  if (status === 409) {
    return (
      data?.message ||
      data?.error ||
      "This payment could not be completed because of a conflict."
    );
  }

  if (status >= 500) {
    return (
      data?.message ||
      data?.error ||
      "Server error. Please try again."
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data?.message) {
    return String(data.message);
  }

  if (data?.error) {
    return String(data.error);
  }

  if (error?.message) {
    return String(error.message);
  }

  return fallback;
}

function isValidUpiId(value) {
  return UPI_REGEX.test(
    String(value || "").trim()
  );
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

function extractUpiData(value) {
  if (!value) {
    return {
      upiId: "",
      name: "",
      amount: "",
      note: "",
    };
  }

  const text = String(value).trim();

  /*
   * Direct UPI ID
   */
  if (isValidUpiId(text)) {
    return {
      upiId: text,
      name: "",
      amount: "",
      note: "",
    };
  }

  /*
   * UPI payment URI
   *
   * Example:
   * upi://pay?pa=tushar@bank&pn=Tushar&am=100&cu=INR
   */
  try {
    if (
      text.toLowerCase().startsWith("upi://")
    ) {
      const url = new URL(text);

      return {
        upiId:
          url.searchParams.get("pa") || "",
        name:
          url.searchParams.get("pn") || "",
        amount:
          url.searchParams.get("am") || "",
        note:
          url.searchParams.get("tn") || "",
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

/* ============================================================
   COMPONENT
============================================================ */

export default function ScanPay() {
  /* ==========================================================
     REFS
  ========================================================== */

  const scannerRef = useRef(null);
  const qrRef = useRef(null);
  const scanProcessingRef = useRef(false);
  const paymentProcessingRef = useRef(false);

  /* ==========================================================
     STATE
  ========================================================== */

  const [scanning, setScanning] =
    useState(false);

  const [
    receiverUpiId,
    setReceiverUpiId,
  ] = useState("");

  const [receiver, setReceiver] =
    useState(null);

  const [
    senderUpiId,
    setSenderUpiId,
  ] = useState(
    () =>
      localStorage.getItem("upiId") || ""
  );

  const [amount, setAmount] =
    useState("");

  const [qrAmount, setQrAmount] =
    useState("");

  const [
    loadingReceiver,
    setLoadingReceiver,
  ] = useState(false);

  const [paying, setPaying] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    paymentResult,
    setPaymentResult,
  ] = useState(null);

  const [snackbar, setSnackbar] =
    useState({
      open: false,
      message: "",
    });

  /* ==========================================================
     SNACKBAR
  ========================================================== */

  const showSnackbar = useCallback(
    (text) => {
      setSnackbar({
        open: true,
        message: String(text),
      });
    },
    []
  );

  const closeSnackbar = useCallback(() => {
    setSnackbar({
      open: false,
      message: "",
    });
  }, []);

  /* ==========================================================
     QR VALUE
  ========================================================== */

  const qrValue = useMemo(() => {
    const cleanSender =
      senderUpiId.trim();

    if (!cleanSender) {
      return "";
    }

    const params = new URLSearchParams();

    params.set("pa", cleanSender);
    params.set("pn", "Bank Customer");
    params.set("cu", "INR");

    const numericQrAmount =
      Number(qrAmount);

    if (
      Number.isFinite(
        numericQrAmount
      ) &&
      numericQrAmount > 0 &&
      numericQrAmount <=
        MAX_QR_AMOUNT
    ) {
      params.set(
        "am",
        numericQrAmount.toFixed(2)
      );
    }

    return `upi://pay?${params.toString()}`;
  }, [senderUpiId, qrAmount]);

  /* ==========================================================
     STOP SCANNER
  ========================================================== */

  const stopScanner = useCallback(
    async () => {
      const activeScanner =
        scannerRef.current;

      scannerRef.current = null;

      setScanning(false);
      scanProcessingRef.current = false;

      if (!activeScanner) {
        return;
      }

      try {
        const state =
          activeScanner.getState();

        /*
         * Html5Qrcode:
         *
         * NOT_STARTED = 1
         * SCANNING    = 2
         * PAUSED      = 3
         */
        if (
          state === 2 ||
          state === 3
        ) {
          await activeScanner.stop();
        }
      } catch {
        // Scanner may already be stopped.
      }

      try {
        await activeScanner.clear();
      } catch {
        // Ignore cleanup errors.
      }
    },
    []
  );

  /* ==========================================================
     FIND RECEIVER
  ========================================================== */

  const findReceiver = useCallback(
    async (upiId = receiverUpiId) => {
      const cleanUpiId =
        String(upiId || "")
          .trim()
          .toLowerCase();

      if (!cleanUpiId) {
        setError(
          "Enter or scan a receiver UPI ID."
        );
        return null;
      }

      if (
        !isValidUpiId(cleanUpiId)
      ) {
        setError(
          "Enter a valid UPI ID, for example tushar@bank."
        );
        return null;
      }

      const cleanSender =
        senderUpiId
          .trim()
          .toLowerCase();

      if (
        cleanSender &&
        cleanSender === cleanUpiId
      ) {
        setError(
          "Sender and receiver UPI IDs cannot be the same."
        );
        return null;
      }

      setLoadingReceiver(true);
      setError("");
      setMessage("");
      setReceiver(null);

      try {
        const response =
          await api.get(
            `/upi/profile/${encodeURIComponent(
              cleanUpiId
            )}`
          );

        const data =
          response?.data;

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "Invalid receiver profile returned by server."
          );
        }

        if (
          data.active === false
        ) {
          throw new Error(
            "This UPI profile is currently inactive."
          );
        }

        setReceiver(data);

        setReceiverUpiId(
          data.upiId ||
            cleanUpiId
        );

        setMessage(
          "Receiver verified successfully."
        );

        return data;
      } catch (err) {
        setReceiver(null);

        setError(
          getApiErrorMessage(
            err,
            "Receiver UPI profile could not be verified."
          )
        );

        return null;
      } finally {
        setLoadingReceiver(false);
      }
    },
    [
      receiverUpiId,
      senderUpiId,
    ]
  );

  /* ==========================================================
     QR RESULT
  ========================================================== */

  const handleQrResult =
    useCallback(
      async (decodedText) => {
        if (
          !decodedText ||
          scanProcessingRef.current
        ) {
          return;
        }

        scanProcessingRef.current =
          true;

        const data =
          extractUpiData(
            decodedText
          );

        if (!data.upiId) {
          scanProcessingRef.current =
            false;

          setError(
            "The scanned QR does not contain a valid UPI payment address."
          );

          return;
        }

        await stopScanner();

        setReceiverUpiId(
          data.upiId
        );

        if (
          data.amount &&
          Number(data.amount) > 0
        ) {
          const qrNumericAmount =
            Number(data.amount);

          if (
            Number.isFinite(
              qrNumericAmount
            ) &&
            qrNumericAmount <=
              MAX_PAYMENT_AMOUNT
          ) {
            setAmount(
              qrNumericAmount.toString()
            );
          }
        }

        setError("");
        setMessage(
          "UPI QR scanned successfully."
        );

        await findReceiver(
          data.upiId
        );
      },
      [
        findReceiver,
        stopScanner,
      ]
    );

  /* ==========================================================
     START SCANNER
  ========================================================== */

  const startScanner =
    useCallback(async () => {
      if (
        scanning ||
        scannerRef.current
      ) {
        return;
      }

      setError("");
      setMessage("");
      setPaymentResult(null);

      scanProcessingRef.current =
        false;

      try {
        const container =
          document.getElementById(
            "upi-qr-reader"
          );

        if (!container) {
          throw new Error(
            "QR scanner container was not found."
          );
        }

        if (
          scannerRef.current
        ) {
          await stopScanner();
        }

        container.innerHTML = "";

        const qrScanner =
          new Html5Qrcode(
            "upi-qr-reader"
          );

        scannerRef.current =
          qrScanner;

        await qrScanner.start(
          {
            facingMode:
              "environment",
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
            await handleQrResult(
              decodedText
            );
          },
          () => {
            // Ignore continuous camera frame errors.
          }
        );

        setScanning(true);
      } catch (err) {
        scannerRef.current =
          null;

        setScanning(false);

        const errorText =
          String(
            err?.message || ""
          ).toLowerCase();

        if (
          errorText.includes(
            "permission"
          ) ||
          errorText.includes(
            "notallowed"
          )
        ) {
          setError(
            "Camera permission was denied. Allow camera access and try again."
          );
        } else if (
          errorText.includes(
            "camera"
          ) ||
          errorText.includes(
            "notreadable"
          ) ||
          errorText.includes(
            "device"
          )
        ) {
          setError(
            "Unable to access your camera. Check browser permissions and make sure another application is not using the camera."
          );
        } else {
          setError(
            getApiErrorMessage(
              err,
              "Unable to start QR scanner."
            )
          );
        }
      }
    }, [
      handleQrResult,
      scanning,
      stopScanner,
    ]);

  /* ==========================================================
     PAYMENT VALIDATION
  ========================================================== */

  const validatePayment =
    useCallback(() => {
      const cleanSender =
        senderUpiId
          .trim()
          .toLowerCase();

      const cleanReceiver =
        (
          receiver?.upiId ||
          receiverUpiId
        )
          .trim()
          .toLowerCase();

      if (!cleanSender) {
        return {
          valid: false,
          error:
            "Enter your sender UPI ID.",
        };
      }

      if (
        !isValidUpiId(cleanSender)
      ) {
        return {
          valid: false,
          error:
            "Enter a valid sender UPI ID.",
        };
      }

      if (!cleanReceiver) {
        return {
          valid: false,
          error:
            "Verify the receiver UPI ID first.",
        };
      }

      if (
        !isValidUpiId(
          cleanReceiver
        )
      ) {
        return {
          valid: false,
          error:
            "Receiver UPI ID is invalid.",
        };
      }

      if (
        cleanSender ===
        cleanReceiver
      ) {
        return {
          valid: false,
          error:
            "Sender and receiver UPI IDs cannot be the same.",
        };
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return {
          valid: false,
          error:
            "Enter a valid payment amount.",
        };
      }

      if (
        numericAmount >
        MAX_PAYMENT_AMOUNT
      ) {
        return {
          valid: false,
          error:
            "Payment amount cannot exceed ₹10,00,000.",
        };
      }

      return {
        valid: true,
        sender: cleanSender,
        receiver: cleanReceiver,
        amount: Number(
          numericAmount.toFixed(2)
        ),
      };
    }, [
      amount,
      receiver,
      receiverUpiId,
      senderUpiId,
    ]);

  /* ==========================================================
     MAKE PAYMENT
  ========================================================== */

  const makePayment =
    useCallback(async () => {
      if (
        paymentProcessingRef.current
      ) {
        return;
      }

      setError("");
      setMessage("");
      setPaymentResult(null);

      const validation =
        validatePayment();

      if (!validation.valid) {
        setError(
          validation.error
        );
        return;
      }

      paymentProcessingRef.current =
        true;

      setPaying(true);

      try {
        const response =
          await api.post(
            "/upi/pay",
            {
              senderUpiId:
                validation.sender,
              receiverUpiId:
                validation.receiver,
              amount:
                validation.amount,
            }
          );

        const data =
          response?.data;

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "Invalid payment response from server."
          );
        }

        setPaymentResult(data);

        setMessage(
          "Payment completed successfully."
        );

        setAmount("");
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "UPI payment failed. Please try again."
          )
        );
      } finally {
        paymentProcessingRef.current =
          false;

        setPaying(false);
      }
    }, [validatePayment]);

  /* ==========================================================
     COPY UPI
  ========================================================== */

  const copyUpiId =
    useCallback(async () => {
      const upiId =
        senderUpiId.trim();

      if (!upiId) {
        showSnackbar(
          "No UPI ID available."
        );
        return;
      }

      try {
        await navigator.clipboard.writeText(
          upiId
        );

        showSnackbar(
          "UPI ID copied to clipboard."
        );
      } catch {
        showSnackbar(
          "Unable to copy UPI ID."
        );
      }
    }, [
      senderUpiId,
      showSnackbar,
    ]);

  /* ==========================================================
     SHARE UPI
  ========================================================== */

  const shareUpi =
    useCallback(async () => {
      const upiId =
        senderUpiId.trim();

      if (!upiId) {
        showSnackbar(
          "No UPI ID available to share."
        );
        return;
      }

      const shareData = {
        title: "My UPI ID",
        text: `Pay me on UPI: ${upiId}`,
      };

      try {
        if (
          typeof navigator.share ===
          "function"
        ) {
          await navigator.share(
            shareData
          );
        } else {
          await navigator.clipboard.writeText(
            shareData.text
          );

          showSnackbar(
            "UPI payment information copied."
          );
        }
      } catch (err) {
        if (
          err?.name !==
          "AbortError"
        ) {
          showSnackbar(
            "Unable to share UPI information."
          );
        }
      }
    }, [
      senderUpiId,
      showSnackbar,
    ]);

  /* ==========================================================
     DOWNLOAD QR
  ========================================================== */

  const downloadQr =
    useCallback(() => {
      if (
        !qrRef.current ||
        !senderUpiId.trim()
      ) {
        showSnackbar(
          "Generate your UPI QR first."
        );
        return;
      }

      const svg =
        qrRef.current.querySelector(
          "svg"
        );

      if (!svg) {
        showSnackbar(
          "QR code is not ready yet."
        );
        return;
      }

      try {
        const serializer =
          new XMLSerializer();

        const source =
          serializer.serializeToString(
            svg
          );

        const svgBlob =
          new Blob(
            [source],
            {
              type:
                "image/svg+xml;charset=utf-8",
            }
          );

        const url =
          URL.createObjectURL(
            svgBlob
          );

        const image =
          new Image();

        image.onload = () => {
          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width = 1000;
          canvas.height = 1000;

          const context =
            canvas.getContext(
              "2d"
            );

          if (!context) {
            URL.revokeObjectURL(
              url
            );

            showSnackbar(
              "Unable to create QR image."
            );

            return;
          }

          context.fillStyle =
            "#ffffff";

          context.fillRect(
            0,
            0,
            1000,
            1000
          );

          context.drawImage(
            image,
            100,
            100,
            800,
            800
          );

          URL.revokeObjectURL(
            url
          );

          const link =
            document.createElement(
              "a"
            );

          link.download =
            "my-upi-qr.png";

          link.href =
            canvas.toDataURL(
              "image/png"
            );

          document.body.appendChild(
            link
          );

          link.click();

          document.body.removeChild(
            link
          );

          showSnackbar(
            "UPI QR downloaded successfully."
          );
        };

        image.onerror = () => {
          URL.revokeObjectURL(
            url
          );

          showSnackbar(
            "Unable to generate QR image."
          );
        };

        image.src = url;
      } catch {
        showSnackbar(
          "Unable to download QR code."
        );
      }
    }, [
      senderUpiId,
      showSnackbar,
    ]);

  /* ==========================================================
     RESET
  ========================================================== */

  const resetPayment =
    useCallback(() => {
      setReceiverUpiId("");
      setReceiver(null);
      setAmount("");
      setPaymentResult(null);
      setError("");
      setMessage("");
    }, []);

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      const activeScanner =
        scannerRef.current;

      scannerRef.current =
        null;

      if (activeScanner) {
        activeScanner
          .stop()
          .catch(() => {})
          .finally(() => {
            activeScanner
              .clear()
              .catch(() => {});
          });
      }
    };
  }, []);

  /* ==========================================================
     RENDER
  ========================================================== */

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
            Scan a UPI QR code, verify the recipient,
            and complete your payment securely.
          </Typography>
        </Box>

        <Box className="scan-pay-header-badge">
          <QrCode2Icon />

          <Typography>
            UPI
          </Typography>
        </Box>

      </Box>

      {/* SECURITY BANNER */}

      <Card className="security-banner">

        <Box className="security-icon">
          <SecurityIcon />
        </Box>

        <Box>
          <Typography className="security-title">
            Secure UPI Payments
          </Typography>

          <Typography className="security-text">
            Always verify the recipient details
            before confirming a payment.
          </Typography>
        </Box>

        <Chip
          icon={<VerifiedIcon />}
          label="Protected"
          className="protected-chip"
        />

      </Card>

      {/* ALERTS */}

      {message && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() =>
            setMessage("")
          }
        >
          {message}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {/* MAIN GRID */}

      <Box className="scan-pay-grid">

        {/* LEFT COLUMN */}

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
                    Let another person scan this QR
                    code to pay you instantly.
                  </Typography>

                </Box>

                <Box className="section-icon-box">
                  <QrCode2Icon />
                </Box>

              </Box>

              <Divider sx={{ my: 3 }} />

              {!senderUpiId.trim() ? (

                <Alert severity="warning">
                  Your UPI ID is not available.
                  Enter your UPI ID in Payment
                  Details to generate your QR code.
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
                      Scan this code using any
                      compatible UPI app
                    </Typography>

                  </Box>

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
                      startIcon={
                        <ContentCopyIcon />
                      }
                      onClick={
                        copyUpiId
                      }
                      fullWidth
                    >
                      Copy UPI ID
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={
                        <DownloadIcon />
                      }
                      onClick={
                        downloadQr
                      }
                      fullWidth
                    >
                      Download QR
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={
                        <ShareIcon />
                      }
                      onClick={
                        shareUpi
                      }
                      fullWidth
                    >
                      Share
                    </Button>

                  </Stack>

                  <Box className="qr-amount-box">

                    <Typography className="qr-amount-title">
                      Create QR with amount
                    </Typography>

                    <Typography className="qr-amount-description">
                      Optional. Leave empty if the
                      payer should enter the amount.
                    </Typography>

                    <TextField
                      value={qrAmount}
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        if (
                          value === "" ||
                          (
                            !Number.isNaN(
                              Number(value)
                            ) &&
                            Number(value) >= 0 &&
                            Number(value) <=
                              MAX_QR_AMOUNT
                          )
                        ) {
                          setQrAmount(
                            value
                          );
                        }
                      }}
                      type="number"
                      placeholder="Optional amount"
                      fullWidth
                      size="small"
                      slotProps={{
                        htmlInput: {
                          min: 0.01,
                          max: MAX_QR_AMOUNT,
                          step: 0.01,
                          inputMode:
                            "decimal",
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mt: 1.5,
                      }}
                    />

                  </Box>

                </>
              )}

            </CardContent>

          </Card>

          {/* QR SCANNER */}

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
                    Point your camera at the
                    recipient's UPI QR code.
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
                  scanning
                    ? "qr-reader-active"
                    : ""
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
                      Click "Scan QR" and allow
                      camera access when prompted.
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
                    startIcon={
                      <QrCodeScannerIcon />
                    }
                    onClick={
                      startScanner
                    }
                  >
                    Scan QR
                  </Button>

                ) : (

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={
                      <StopCircleOutlinedIcon />
                    }
                    onClick={
                      stopScanner
                    }
                  >
                    Stop Scanner
                  </Button>

                )}

              </Stack>

            </CardContent>

          </Card>

        </Box>

        {/* RIGHT COLUMN */}

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
                  Verify the recipient before
                  sending money.
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
                  const value =
                    event.target.value;

                  setSenderUpiId(
                    value
                  );

                  const cleanValue =
                    value.trim();

                  if (
                    cleanValue
                  ) {
                    localStorage.setItem(
                      "upiId",
                      cleanValue
                    );
                  } else {
                    localStorage.removeItem(
                      "upiId"
                    );
                  }

                  setReceiver(
                    null
                  );

                  setPaymentResult(
                    null
                  );
                }}
                fullWidth
                helperText={
                  senderUpiId
                    ? "This UPI ID will be used for payment."
                    : "Enter your UPI ID to generate your QR."
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceIcon />
                    </InputAdornment>
                  ),
                  endAdornment:
                    senderUpiId ? (
                      <InputAdornment position="end">
                        <Tooltip title="UPI ID">
                          <VerifiedIcon color="success" />
                        </Tooltip>
                      </InputAdornment>
                    ) : null,
                }}
              />

              {/* RECEIVER */}

              <TextField
                label="Receiver UPI ID"
                value={receiverUpiId}
                onChange={(event) => {
                  setReceiverUpiId(
                    event.target.value
                  );

                  setReceiver(
                    null
                  );

                  setPaymentResult(
                    null
                  );

                  setError("");
                  setMessage("");
                }}
                placeholder="example@bank"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PaymentsIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* VERIFY */}

              <Button
                variant="outlined"
                size="large"
                onClick={() =>
                  findReceiver()
                }
                disabled={
                  loadingReceiver ||
                  !receiverUpiId.trim()
                }
                startIcon={
                  loadingReceiver ? (
                    <CircularProgress
                      size={20}
                    />
                  ) : (
                    <VerifiedIcon />
                  )
                }
              >
                {loadingReceiver
                  ? "Verifying..."
                  : "Verify Receiver"}
              </Button>

              {/* RECEIVER VERIFIED */}

              {receiver && (
                <Box className="receiver-box">

                  <Box className="receiver-top">

                    <Box className="receiver-avatar">

                      {String(
                        receiver.displayName ||
                          receiver.name ||
                          "U"
                      )
                        .charAt(0)
                        .toUpperCase()}

                    </Box>

                    <Box>

                      <Typography className="receiver-label">
                        VERIFIED RECEIVER
                      </Typography>

                      <Typography className="receiver-name">
                        {String(
                          receiver.displayName ||
                            receiver.name ||
                            "Verified User"
                        )}
                      </Typography>

                      <Typography className="receiver-upi">
                        {String(
                          receiver.upiId ||
                            receiverUpiId
                        )}
                      </Typography>

                    </Box>

                    <VerifiedIcon className="receiver-verified-icon" />

                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box className="receiver-account-row">

                    <AccountBalanceIcon />

                    <Box>

                      <Typography className="receiver-account-label">
                        Bank Account
                      </Typography>

                      <Typography className="receiver-account">
                        {String(
                          receiver.accountId ||
                            receiver.accountNumber ||
                            "Account verified"
                        )}
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
                  const value =
                    event.target.value;

                  if (
                    value === "" ||
                    (
                      !Number.isNaN(
                        Number(value)
                      ) &&
                      Number(value) >= 0 &&
                      Number(value) <=
                        MAX_PAYMENT_AMOUNT
                    )
                  ) {
                    setAmount(
                      value
                    );

                    setPaymentResult(
                      null
                    );
                  }
                }}
                type="number"
                fullWidth
                slotProps={{
                  htmlInput: {
                    min: 0.01,
                    max:
                      MAX_PAYMENT_AMOUNT,
                    step: 0.01,
                    inputMode:
                      "decimal",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      ₹
                    </InputAdornment>
                  ),
                }}
              />

              {/* SUMMARY */}

              {receiver &&
                amount &&
                Number(amount) > 0 && (
                  <Box className="payment-summary">

                    <Typography className="summary-title">
                      Payment Summary
                    </Typography>

                    <Box className="summary-row">

                      <Typography>
                        To
                      </Typography>

                      <Typography className="summary-value">
                        {String(
                          receiver.displayName ||
                            receiver.name ||
                            receiver.upiId
                        )}
                      </Typography>

                    </Box>

                    <Box className="summary-row">

                      <Typography>
                        UPI ID
                      </Typography>

                      <Typography className="summary-value">
                        {String(
                          receiver.upiId
                        )}
                      </Typography>

                    </Box>

                    <Divider
                      sx={{
                        my: 1.5,
                      }}
                    />

                    <Box className="summary-total">

                      <Typography>
                        Total
                      </Typography>

                      <Typography>
                        ₹
                        {formatAmount(
                          amount
                        )}
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
                  Number(amount) <=
                    0 ||
                  Number(amount) >
                    MAX_PAYMENT_AMOUNT ||
                  paying
                }
                onClick={
                  makePayment
                }
                className="pay-button"
                endIcon={
                  !paying ? (
                    <ArrowForwardIcon />
                  ) : null
                }
              >

                {paying ? (
                  <>
                    <CircularProgress
                      size={22}
                      color="inherit"
                      sx={{
                        mr: 1,
                      }}
                    />

                    Processing Payment...
                  </>
                ) : (
                  "Pay Now"
                )}

              </Button>

              {/* SECURITY */}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent:
                    "center",
                  opacity: 0.7,
                  py: 0.5,
                }}
              >

                <LockOutlinedIcon
                  fontSize="small"
                />

                <Typography
                  variant="caption"
                >
                  Secure JWT-authenticated
                  payment request
                </Typography>

              </Box>

              {/* RESET */}

              {(receiver ||
                paymentResult) && (
                <Button
                  variant="text"
                  startIcon={
                    <RefreshIcon />
                  }
                  onClick={
                    resetPayment
                  }
                >
                  Start New Payment
                </Button>
              )}

            </Stack>

          </CardContent>

        </Card>

      </Box>

      {/* PAYMENT SUCCESS */}

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
                  Your UPI payment has been
                  completed successfully.
                </Typography>

              </Box>

            </Box>

            <Divider sx={{ my: 3 }} />

            <Box className="success-amount">
              ₹
              {formatAmount(
                paymentResult.amount
              )}
            </Box>

            <Typography className="success-recipient">
              Sent to{" "}
              <strong>
                {String(
                  paymentResult.receiverUpiId ||
                    receiver?.upiId ||
                    receiverUpiId
                )}
              </strong>
            </Typography>

            <Box className="success-details">

              {/* STATUS */}

              <Box>

                <Typography>
                  Status
                </Typography>

                <Chip
                  label={String(
                    paymentResult.status ||
                      "SUCCESS"
                  )}
                  color="success"
                  size="small"
                />

              </Box>

              {/* SENDER */}

              <Box>

                <Typography>
                  Sender
                </Typography>

                <strong>
                  {String(
                    paymentResult.senderUpiId ||
                      senderUpiId
                  )}
                </strong>

              </Box>

              {/* RECEIVER */}

              <Box>

                <Typography>
                  Receiver
                </Typography>

                <strong>
                  {String(
                    paymentResult.receiverUpiId ||
                      receiverUpiId
                  )}
                </strong>

              </Box>

              {/* TRANSACTION ID */}

              {paymentResult.transactionId && (
                <Box>

                  <Typography>
                    Transaction ID
                  </Typography>

                  <strong>
                    {String(
                      paymentResult.transactionId
                    )}
                  </strong>

                </Box>
              )}

            </Box>

            {/* RECEIPT FOOTER */}

            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop:
                  "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                alignItems:
                  "center",
                gap: 1,
              }}
            >

              <ReceiptLongIcon
                fontSize="small"
              />

              <Typography
                variant="body2"
              >
                Keep the transaction ID
                for future reference.
              </Typography>

            </Box>

          </CardContent>

        </Card>
      )}

      {/* SNACKBAR */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={
          closeSnackbar
        }
        message={
          snackbar.message
        }
      />

    </Box>
  );
}