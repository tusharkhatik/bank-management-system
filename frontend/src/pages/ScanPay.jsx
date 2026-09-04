import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
      "Invalid request."
    );
  }

  if (status === 401) {
    return "Your session has expired. Please login again.";
  }

  if (status === 403) {
    return (
      data?.message ||
      data?.error ||
      "You are not authorized to perform this operation."
    );
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
      "This operation could not be completed because of a conflict."
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

/*
 * Robust UPI QR parser.
 *
 * Supports:
 *
 * 1. Direct UPI ID
 *    tushar@bank
 *
 * 2. UPI URI
 *    upi://pay?pa=tushar@bank&pn=Tushar&cu=INR
 *
 * 3. UPI URI with amount
 *    upi://pay?pa=tushar@bank&pn=Tushar&am=500.00&cu=INR
 */
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

  /* Direct UPI ID */
  if (isValidUpiId(text)) {
    return {
      upiId: text.toLowerCase(),
      name: "",
      amount: "",
      note: "",
    };
  }

  /*
   * Decode QR text safely.
   */
  let decodedText = text;

  try {
    decodedText = decodeURIComponent(text);
  } catch {
    decodedText = text;
  }

  /*
   * UPI URI.
   */
  if (
    decodedText
      .toLowerCase()
      .startsWith("upi://")
  ) {
    try {
      const queryIndex =
        decodedText.indexOf("?");

      if (queryIndex === -1) {
        return {
          upiId: "",
          name: "",
          amount: "",
          note: "",
        };
      }

      const queryString =
        decodedText.substring(
          queryIndex + 1
        );

      const params =
        new URLSearchParams(
          queryString
        );

      const upiId =
        String(
          params.get("pa") || ""
        )
          .trim()
          .toLowerCase();

      const name =
        String(
          params.get("pn") || ""
        ).trim();

      const amount =
        String(
          params.get("am") || ""
        ).trim();

      const note =
        String(
          params.get("tn") || ""
        ).trim();

      if (!isValidUpiId(upiId)) {
        return {
          upiId: "",
          name,
          amount,
          note,
        };
      }

      return {
        upiId,
        name,
        amount,
        note,
      };
    } catch {
      return {
        upiId: "",
        name: "",
        amount: "",
        note: "",
      };
    }
  }

  /*
   * Some QR generators may return the URL without
   * the expected casing.
   */
  try {
    const lower =
      decodedText.toLowerCase();

    const paIndex =
      lower.indexOf("pa=");

    if (paIndex !== -1) {
      const queryPart =
        decodedText.substring(
          paIndex
        );

      const params =
        new URLSearchParams(
          queryPart
        );

      const upiId =
        String(
          params.get("pa") || ""
        )
          .trim()
          .toLowerCase();

      if (isValidUpiId(upiId)) {
        return {
          upiId,
          name:
            params.get("pn") || "",
          amount:
            params.get("am") || "",
          note:
            params.get("tn") || "",
        };
      }
    }
  } catch {
    // Ignore parser fallback errors.
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

  const scannerRef =
    useRef(null);

  const qrRef =
    useRef(null);

  const customQrRef =
    useRef(null);

  const scanProcessingRef =
    useRef(false);

  const paymentProcessingRef =
    useRef(false);

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

  /*
   * Sender is ALWAYS loaded from backend.
   */
  const [
    senderUpiId,
    setSenderUpiId,
  ] = useState("");

  const [
    senderProfile,
    setSenderProfile,
  ] = useState(null);

  const [
    loadingSender,
    setLoadingSender,
  ] = useState(true);

  const [amount, setAmount] =
    useState("");

  /*
   * Custom amount QR.
   *
   * This is separate from the permanent QR.
   */
  const [
    customQrAmount,
    setCustomQrAmount,
  ] = useState("");

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

  const showSnackbar =
    useCallback((text) => {
      setSnackbar({
        open: true,
        message: String(text),
      });
    }, []);

  const closeSnackbar =
    useCallback(() => {
      setSnackbar({
        open: false,
        message: "",
      });
    }, []);

  /* ==========================================================
     LOAD MY UPI PROFILE
  ========================================================== */

  const loadMyUpiProfile =
    useCallback(async () => {
      setLoadingSender(true);
      setError("");

      try {
        const response =
          await api.get(
            "/upi/profile/me"
          );

        const data =
          response?.data;

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "Invalid UPI profile returned by server."
          );
        }

        const cleanUpiId =
          String(
            data.upiId || ""
          )
            .trim()
            .toLowerCase();

        if (
          !cleanUpiId ||
          !isValidUpiId(cleanUpiId)
        ) {
          throw new Error(
            "Your UPI profile contains an invalid UPI ID."
          );
        }

        if (data.active === false) {
          throw new Error(
            "Your UPI profile is currently inactive."
          );
        }

        setSenderProfile(data);
        setSenderUpiId(cleanUpiId);

        /*
         * Cache only for convenience.
         * It is NOT the source of truth.
         */
        localStorage.setItem(
          "upiId",
          cleanUpiId
        );
      } catch (err) {
        setSenderProfile(null);
        setSenderUpiId("");

        setError(
          getApiErrorMessage(
            err,
            "Your UPI profile could not be loaded."
          )
        );
      } finally {
        setLoadingSender(false);
      }
    }, []);

  useEffect(() => {
    loadMyUpiProfile();
  }, [loadMyUpiProfile]);

  /* ==========================================================
     PERMANENT PERSONAL QR
  ========================================================== */

  const qrValue =
    useMemo(() => {
      const cleanSender =
        senderUpiId
          .trim()
          .toLowerCase();

      if (
        !cleanSender ||
        !isValidUpiId(cleanSender)
      ) {
        return "";
      }

      /*
       * IMPORTANT:
       *
       * There is NO amount here.
       *
       * Therefore this QR remains stable.
       */
      const params =
        new URLSearchParams();

      params.set(
        "pa",
        cleanSender
      );

      params.set(
        "pn",
        String(
          senderProfile?.displayName ||
            "Bank Customer"
        )
      );

      params.set(
        "cu",
        "INR"
      );

      return `upi://pay?${params.toString()}`;
    }, [
      senderUpiId,
      senderProfile?.displayName,
    ]);

  /* ==========================================================
     CUSTOM AMOUNT QR
  ========================================================== */

  const customQrValue =
    useMemo(() => {
      const cleanSender =
        senderUpiId
          .trim()
          .toLowerCase();

      const numericAmount =
        Number(customQrAmount);

      if (
        !cleanSender ||
        !isValidUpiId(cleanSender)
      ) {
        return "";
      }

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0 ||
        numericAmount >
          MAX_PAYMENT_AMOUNT
      ) {
        return "";
      }

      const params =
        new URLSearchParams();

      params.set(
        "pa",
        cleanSender
      );

      params.set(
        "pn",
        String(
          senderProfile?.displayName ||
            "Bank Customer"
        )
      );

      params.set(
        "am",
        numericAmount.toFixed(2)
      );

      params.set(
        "cu",
        "INR"
      );

      return `upi://pay?${params.toString()}`;
    }, [
      customQrAmount,
      senderProfile?.displayName,
      senderUpiId,
    ]);

  /* ==========================================================
     STOP SCANNER
  ========================================================== */

  const stopScanner =
    useCallback(async () => {
      const activeScanner =
        scannerRef.current;

      scannerRef.current =
        null;

      scanProcessingRef.current =
        false;

      setScanning(false);

      if (!activeScanner) {
        return;
      }

      try {
        const state =
          activeScanner.getState();

        /*
         * Html5Qrcode states:
         *
         * 1 = NOT_STARTED
         * 2 = SCANNING
         * 3 = PAUSED
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

      const container =
        document.getElementById(
          "upi-qr-reader"
        );

      if (container) {
        container.innerHTML = "";
      }
    }, []);

  /* ==========================================================
     FIND RECEIVER
  ========================================================== */

  const findReceiver =
    useCallback(
      async (
        upiId = receiverUpiId
      ) => {
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
            String(
              data.upiId ||
                cleanUpiId
            )
              .trim()
              .toLowerCase()
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
     HANDLE QR RESULT
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

        try {
          const data =
            extractUpiData(
              decodedText
            );

          if (!data.upiId) {
            scanProcessingRef.current =
              false;

            setError(
              "QR scanned, but it does not contain a valid UPI payment address."
            );

            return;
          }

          const scannedUpiId =
            String(
              data.upiId
            )
              .trim()
              .toLowerCase();

          const cleanSender =
            senderUpiId
              .trim()
              .toLowerCase();

          if (
            cleanSender ===
            scannedUpiId
          ) {
            await stopScanner();

            setReceiverUpiId(
              scannedUpiId
            );

            setReceiver(null);

            setError(
              "You cannot scan your own UPI QR for payment."
            );

            return;
          }

          /*
           * Stop camera FIRST.
           */
          await stopScanner();

          setReceiverUpiId(
            scannedUpiId
          );

          /*
           * If QR contains amount,
           * automatically use it.
           */
          if (data.amount) {
            const qrAmount =
              Number(data.amount);

            if (
              Number.isFinite(
                qrAmount
              ) &&
              qrAmount > 0 &&
              qrAmount <=
                MAX_PAYMENT_AMOUNT
            ) {
              setAmount(
                qrAmount.toFixed(2)
              );
            }
          }

          setError("");

          setMessage(
            data.amount
              ? `QR scanned successfully. Amount ₹${formatAmount(
                  data.amount
                )} was detected.`
              : "UPI QR scanned successfully."
          );

          /*
           * Automatically verify receiver.
           */
          await findReceiver(
            scannedUpiId
          );
        } catch (err) {
          scanProcessingRef.current =
            false;

          setError(
            getApiErrorMessage(
              err,
              "Unable to process the scanned QR code."
            )
          );
        }
      },
      [
        findReceiver,
        senderUpiId,
        stopScanner,
      ]
    );

  /* ==========================================================
     START SCANNER
  ========================================================== */

  const startScanner =
    useCallback(async () => {
      if (
        scannerRef.current ||
        scanning
      ) {
        return;
      }

      setError("");
      setMessage("");
      setPaymentResult(null);

      scanProcessingRef.current =
        false;

      try {
        /*
         * Check browser camera support.
         */
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Camera access is not supported by this browser."
          );
        }

        /*
         * HTTPS / localhost check.
         */
        if (
          window.location.protocol !==
            "https:" &&
          window.location.hostname !==
            "localhost" &&
          window.location.hostname !==
            "127.0.0.1"
        ) {
          throw new Error(
            "Camera access requires HTTPS. Open the application using HTTPS."
          );
        }

        const container =
          document.getElementById(
            "upi-qr-reader"
          );

        if (!container) {
          throw new Error(
            "QR scanner container was not found."
          );
        }

        /*
         * Make sure any previous scanner is removed.
         */
        if (scannerRef.current) {
          await stopScanner();
        }

        container.innerHTML = "";

        const qrScanner =
          new Html5Qrcode(
            "upi-qr-reader"
          );

        scannerRef.current =
          qrScanner;

        /*
         * Set scanning state BEFORE camera starts
         * so UI immediately changes.
         */
        setScanning(true);

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
            await handleQrResult(
              decodedText
            );
          },

          () => {
            /*
             * html5-qrcode continuously reports
             * "QR code not found" while searching.
             *
             * Do NOT display those as errors.
             */
          }
        );
      } catch (err) {
        scannerRef.current =
          null;

        setScanning(false);

        const errorText =
          String(
            err?.message ||
              err ||
              ""
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
            "Camera permission was denied. Allow camera access in your browser settings and try again."
          );
        } else if (
          errorText.includes(
            "secure"
          ) ||
          errorText.includes(
            "https"
          )
        ) {
          setError(
            "Camera scanning requires HTTPS when the application is deployed. It works on localhost."
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

        /*
         * Clean up container.
         */
        const container =
          document.getElementById(
            "upi-qr-reader"
          );

        if (container) {
          container.innerHTML = "";
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
            "Your UPI profile is not available.",
        };
      }

      if (
        !isValidUpiId(
          cleanSender
        )
      ) {
        return {
          valid: false,
          error:
            "Your UPI profile contains an invalid UPI ID.",
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

      if (!senderProfile) {
        return {
          valid: false,
          error:
            "Your UPI profile is still loading.",
        };
      }

      if (
        senderProfile.active === false
      ) {
        return {
          valid: false,
          error:
            "Your UPI profile is inactive.",
        };
      }

      if (!receiver) {
        return {
          valid: false,
          error:
            "Please verify the receiver before making payment.",
        };
      }

      if (
        receiver.active === false
      ) {
        return {
          valid: false,
          error:
            "Receiver UPI profile is inactive.",
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
      senderProfile,
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

        setPaymentResult(
          data
        );

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
    }, [
      validatePayment,
    ]);

  /* ==========================================================
     COPY UPI ID
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
        text:
          `Pay me on UPI: ${upiId}`,
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
     DOWNLOAD SVG AS PNG
  ========================================================== */

  const downloadQrImage =
    useCallback(
      (
        qrContainer,
        filename,
        successMessage
      ) => {
        if (!qrContainer) {
          showSnackbar(
            "QR code is not ready yet."
          );

          return;
        }

        const svg =
          qrContainer.querySelector(
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
              filename;

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
              successMessage
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
      },
      [showSnackbar]
    );

  /* ==========================================================
     DOWNLOAD PERSONAL QR
  ========================================================== */

  const downloadQr =
    useCallback(() => {
      if (!senderUpiId.trim()) {
        showSnackbar(
          "Your UPI profile is not available."
        );

        return;
      }

      downloadQrImage(
        qrRef.current,
        "my-upi-qr.png",
        "Permanent UPI QR downloaded successfully."
      );
    }, [
      downloadQrImage,
      senderUpiId,
      showSnackbar,
    ]);

  /* ==========================================================
     DOWNLOAD CUSTOM QR
  ========================================================== */

  const downloadCustomQr =
    useCallback(() => {
      if (!customQrValue) {
        showSnackbar(
          "Enter a valid custom amount first."
        );

        return;
      }

      downloadQrImage(
        customQrRef.current,
        `upi-qr-${customQrAmount}.png`,
        "Custom amount QR downloaded successfully."
      );
    }, [
      customQrAmount,
      customQrValue,
      downloadQrImage,
      showSnackbar,
    ]);

  /* ==========================================================
     RESET PAYMENT
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
     CLEANUP SCANNER ON UNMOUNT
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

      {/* SECURITY */}

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

        {/* ==================================================
            LEFT
        ================================================== */}

        <Box className="scan-pay-left">

          {/* ==================================================
              PERMANENT QR
          ================================================== */}

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
                    This is your permanent personal
                    UPI QR code.
                  </Typography>

                </Box>

                <Box className="section-icon-box">
                  <QrCode2Icon />
                </Box>

              </Box>

              <Divider sx={{ my: 3 }} />

              {loadingSender ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      "center",
                    py: 5,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : !senderUpiId ? (
                <Alert severity="warning">
                  Your UPI profile is not available.
                  Please create or activate your UPI
                  profile before using Scan & Pay.
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

                    {senderProfile?.displayName && (
                      <Typography
                        sx={{
                          mt: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        {
                          senderProfile.displayName
                        }
                      </Typography>
                    )}

                    <Typography className="qr-helper-text">
                      This QR stays the same because
                      it does not contain a payment amount.
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
                </>
              )}

            </CardContent>

          </Card>

          {/* ==================================================
              CUSTOM AMOUNT QR
          ================================================== */}

          <Card className="scan-pay-card">

            <CardContent>

              <Box className="card-heading-row">

                <Box>

                  <Typography className="section-eyebrow">
                    RECEIVE SPECIFIC AMOUNT
                  </Typography>

                  <Typography className="section-title">
                    Custom Amount QR
                  </Typography>

                  <Typography className="section-description">
                    Create a QR code with a fixed amount.
                    The payer will receive this amount automatically.
                  </Typography>

                </Box>

                <Box className="section-icon-box">
                  <PaymentsIcon />
                </Box>

              </Box>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2.5}>

                <TextField
                  label="Custom Amount"
                  value={customQrAmount}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    if (
                      value === "" ||
                      (
                        !Number.isNaN(
                          Number(value)
                        ) &&
                        Number(value) > 0 &&
                        Number(value) <=
                          MAX_PAYMENT_AMOUNT
                      )
                    ) {
                      setCustomQrAmount(
                        value
                      );
                    }
                  }}
                  type="number"
                  fullWidth
                  placeholder="Example: 500"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        ₹
                      </InputAdornment>
                    ),
                  }}
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
                  helperText="Maximum ₹10,00,000"
                />

                {customQrValue && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "center",
                      flexDirection:
                        "column",
                      alignItems:
                        "center",
                      gap: 1.5,
                    }}
                  >

                    <Box
                      ref={customQrRef}
                      className="generated-qr-wrapper"
                    >
                      <QRCodeSVG
                        value={
                          customQrValue
                        }
                        size={230}
                        level="H"
                        includeMargin
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize:
                          "1.2rem",
                      }}
                    >
                      ₹
                      {formatAmount(
                        customQrAmount
                      )}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        textAlign:
                          "center",
                        opacity: 0.75,
                      }}
                    >
                      This QR contains a fixed
                      payment amount.
                    </Typography>

                    <Button
                      variant="outlined"
                      startIcon={
                        <DownloadIcon />
                      }
                      onClick={
                        downloadCustomQr
                      }
                    >
                      Download Custom QR
                    </Button>

                  </Box>
                )}

              </Stack>

            </CardContent>

          </Card>

          {/* ==================================================
              SCANNER
          ================================================== */}

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
                    Point your camera at the recipient's
                    UPI QR code.
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

        {/* ==================================================
            RIGHT PAYMENT
        ================================================== */}

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
                fullWidth
                disabled
                helperText={
                  loadingSender
                    ? "Loading your UPI profile..."
                    : senderUpiId
                      ? "Verified from your account."
                      : "Your UPI profile is not available."
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
                        <Tooltip title="Verified UPI profile">
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

                  setReceiver(null);
                  setPaymentResult(null);
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
                  !receiverUpiId.trim() ||
                  !senderUpiId.trim()
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

              {/* RECEIVER */}

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
                  !senderUpiId ||
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

      {/* ======================================================
          PAYMENT SUCCESS
      ====================================================== */}

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

