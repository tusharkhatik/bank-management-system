
import { useMemo, useState } from "react";

import {
  AccountBalance,
  CheckCircle,
  ContentCopy,
  Download,
  Error as ErrorIcon,
  History,
  InfoOutlined,
  Lock,
  MoreHoriz,
  ReceiptLong,
  Security,
  Shield,
  TrendingUp,
  VerifiedUser,
} from "@mui/icons-material";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import api from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );
};

/* =========================================================
   EXTRACT BALANCE
========================================================= */

const getResponseBalance = (data) => {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data === "number") {
    return data;
  }

  if (
    typeof data === "string" &&
    !Number.isNaN(Number(data))
  ) {
    return Number(data);
  }

  const possibleBalances = [
    data.balance,
    data.newBalance,
    data.currentBalance,
    data.availableBalance,
    data.account?.balance,
    data.account?.currentBalance,
  ];

  const balance = possibleBalances.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      !Number.isNaN(Number(value))
  );

  return balance !== undefined
    ? Number(balance)
    : null;
};

/* =========================================================
   ERROR MESSAGE
========================================================= */

const getErrorMessage = (error) => {
  const status = error?.response?.status;
  const responseData = error?.response?.data;

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You are not authorized to access this account.";
  }

  if (status === 404) {
    return "Account not found.";
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (error?.message) {
    return error.message;
  }

  return "Unable to complete the transaction.";
};

/* =========================================================
   DEPOSIT
========================================================= */

function Deposit() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [accountVerified, setAccountVerified] =
    useState(false);

  const [accountInfo, setAccountInfo] = useState(null);

  const [errors, setErrors] = useState({});

  const [reviewOpen, setReviewOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [result, setResult] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [showLimits, setShowLimits] = useState(false);

  /* =======================================================
     CONSTANTS
  ======================================================= */

  const dailyLimit = 100000;

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const numericAmount = useMemo(() => {
    const parsed = Number(amount);

    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const amountProgress = Math.min(
    (numericAmount / dailyLimit) * 100,
    100
  );

  const isAmountValid =
    numericAmount >= 1 &&
    numericAmount <= dailyLimit;

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (type, message) => {
    setToast({
      open: true,
      type,
      message,
    });
  };

  /* =======================================================
     ACCOUNT INPUT
  ======================================================= */

  const handleAccountChange = (event) => {
    const value = event.target.value;

    /*
     * Account ID should contain digits only.
     */
    if (!/^\d*$/.test(value)) {
      return;
    }

    setAccountId(value);

    /*
     * Changing account invalidates previous verification.
     */
    setAccountVerified(false);
    setAccountInfo(null);

    setErrors((previous) => ({
      ...previous,
      accountId: "",
      submit: "",
    }));
  };

  /* =======================================================
     AMOUNT INPUT
  ======================================================= */

  const handleAmountChange = (event) => {
    const value = event.target.value;

    /*
     * Allows:
     * 100
     * 100.5
     * 100.50
     * 0.50
     */
    if (!/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }

    setAmount(value);

    setErrors((previous) => ({
      ...previous,
      amount: "",
      submit: "",
    }));
  };

  /* =======================================================
     QUICK AMOUNT
  ======================================================= */

  const handleQuickAmount = (value) => {
    setAmount(String(value));

    setErrors((previous) => ({
      ...previous,
      amount: "",
      submit: "",
    }));
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = () => {
    const validationErrors = {};

    if (!accountId) {
      validationErrors.accountId =
        "Account ID is required.";
    } else if (!/^\d+$/.test(accountId)) {
      validationErrors.accountId =
        "Enter a valid account ID.";
    } else if (Number(accountId) <= 0) {
      validationErrors.accountId =
        "Enter a valid account ID.";
    }

    if (!amount) {
      validationErrors.amount =
        "Deposit amount is required.";
    } else if (numericAmount <= 0) {
      validationErrors.amount =
        "Amount must be greater than ₹0.";
    } else if (numericAmount > dailyLimit) {
      validationErrors.amount =
        `Maximum deposit limit is ${formatCurrency(
          dailyLimit
        )}.`;
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  /* =======================================================
     REAL ACCOUNT VERIFICATION
  ======================================================= */

  const handleVerifyAccount = async () => {
    if (!accountId) {
      setErrors((previous) => ({
        ...previous,
        accountId: "Enter an account ID first.",
      }));

      return;
    }

    if (!/^\d+$/.test(accountId)) {
      setErrors((previous) => ({
        ...previous,
        accountId: "Enter a valid account ID.",
      }));

      return;
    }

    try {
      setVerifying(true);

      setErrors((previous) => ({
        ...previous,
        accountId: "",
      }));

      /*
       * REAL BACKEND CALL
       *
       * AccountController:
       *
       * GET /api/accounts/{id}
       *
       * @PreAuthorize("isAuthenticated()")
       */
      const response = await api.get(
        `/accounts/${accountId}`
      );

      const data = response?.data;

      /*
       * If backend successfully returns the account,
       * mark it as verified.
       */
      setAccountInfo(data);

      setAccountVerified(true);

      showToast(
        "success",
        "Account verified successfully."
      );
    } catch (error) {
      console.error(
        "Account verification failed:",
        error
      );

      setAccountVerified(false);
      setAccountInfo(null);

      const message = getErrorMessage(error);

      setErrors((previous) => ({
        ...previous,
        accountId: message,
      }));

      showToast("error", message);
    } finally {
      setVerifying(false);
    }
  };

  /* =======================================================
     REVIEW
  ======================================================= */

  const handleReview = async () => {
    if (!validate()) {
      return;
    }

    /*
     * Do NOT automatically mark an account as verified.
     *
     * The account must be verified against the backend.
     */
    if (!accountVerified) {
      await handleVerifyAccount();
      return;
    }

    setReviewOpen(true);
  };

  /* =======================================================
     DEPOSIT API
  ======================================================= */

  const handleDeposit = async () => {
    if (!accountId || !isAmountValid) {
      return;
    }

    setReviewOpen(false);

    try {
      setLoading(true);

      setErrors((previous) => ({
        ...previous,
        submit: "",
      }));

      /*
       * REAL BACKEND ENDPOINT
       *
       * POST /api/accounts/{id}/deposit?amount={amount}
       */
      const response = await api.post(
        `/accounts/${accountId}/deposit`,
        null,
        {
          params: {
            amount: numericAmount,
          },
        }
      );

      const data = response?.data;

      console.log(
        "Deposit response:",
        data
      );

      const responseBalance =
        getResponseBalance(data);

      /*
       * Your current AccountController returns
       * AccountResponse from the deposit endpoint.
       *
       * Therefore transactionId may not exist in
       * AccountResponse.
       *
       * We keep support for it if your backend later
       * adds transaction information.
       */
      const transactionId =
        data?.transactionId ||
        data?.transaction?.id ||
        data?.id ||
        `DEP-${Date.now()}`;

      const timestamp =
        data?.timestamp ||
        data?.createdAt ||
        new Date().toISOString();

      const receipt = {
        transactionId,
        accountId,
        amount: numericAmount,
        balance: responseBalance,
        timestamp,
        status: "COMPLETED",
        type: "DEPOSIT",
      };

      setResult(receipt);

      setReceiptOpen(true);

      showToast(
        "success",
        "Deposit completed successfully."
      );

      /*
       * Clear form after successful transaction.
       */
      setAccountId("");
      setAmount("");
      setAccountVerified(false);
      setAccountInfo(null);
      setErrors({});
    } catch (error) {
      console.error(
        "Deposit failed:",
        error
      );

      const message = getErrorMessage(error);

      showToast("error", message);

      setErrors((previous) => ({
        ...previous,
        submit: message,
      }));
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    setAccountId("");
    setAmount("");
    setAccountVerified(false);
    setAccountInfo(null);
    setErrors({});
  };

  /* =======================================================
     COPY TRANSACTION ID
  ======================================================= */

  const copyTransactionId = async () => {
    if (!result?.transactionId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        String(result.transactionId)
      );

      showToast(
        "success",
        "Transaction reference copied."
      );
    } catch {
      showToast(
        "error",
        "Unable to copy transaction reference."
      );
    }
  };

  /* =======================================================
     PRINT RECEIPT
  ======================================================= */

  const printReceipt = () => {
    if (!result) {
      return;
    }

    const receiptWindow = window.open(
      "",
      "_blank",
      "width=700,height=800"
    );

    if (!receiptWindow) {
      showToast(
        "error",
        "Please allow pop-ups to print the receipt."
      );

      return;
    }

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deposit Receipt</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #111827;
          }

          .header {
            border-bottom: 2px solid #111827;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          h1 {
            margin: 0;
            font-size: 24px;
          }

          .success {
            color: #15803d;
            font-weight: bold;
            margin: 20px 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            padding: 14px 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .label {
            color: #6b7280;
          }

          .value {
            font-weight: bold;
          }

          .amount {
            font-size: 28px;
            font-weight: bold;
            margin: 20px 0;
          }

          .footer {
            margin-top: 35px;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>

      <body>

        <div class="header">
          <h1>Bank Management System</h1>
          <div>Deposit Transaction Receipt</div>
        </div>

        <div class="success">
          ✓ TRANSACTION COMPLETED
        </div>

        <div class="amount">
          ₹${Number(result.amount).toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
            }
          )}
        </div>

        <div class="row">
          <span class="label">
            Transaction ID
          </span>

          <span class="value">
            ${result.transactionId}
          </span>
        </div>

        <div class="row">
          <span class="label">
            Account ID
          </span>

          <span class="value">
            ${result.accountId}
          </span>
        </div>

        <div class="row">
          <span class="label">
            Transaction Type
          </span>

          <span class="value">
            Deposit
          </span>
        </div>

        <div class="row">
          <span class="label">
            Status
          </span>

          <span class="value">
            ${result.status}
          </span>
        </div>

        <div class="row">
          <span class="label">
            Date
          </span>

          <span class="value">
            ${new Date(
              result.timestamp
            ).toLocaleString("en-IN")}
          </span>
        </div>

        ${
          result.balance !== null
            ? `
              <div class="row">
                <span class="label">
                  Available Balance
                </span>

                <span class="value">
                  ₹${Number(
                    result.balance
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            `
            : ""
        }

        <div class="footer">
          This is a system-generated transaction receipt.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>

      </body>
      </html>
    `);

    receiptWindow.document.close();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f9",
        px: {
          xs: 1.5,
          sm: 2.5,
          md: 4,
        },
        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <Box
        sx={{
          maxWidth: 1320,
          mx: "auto",
          mb: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Avatar
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                bgcolor: "#ecfdf3",
                color: "#039855",
                border: "1px solid #abefc6",
              }}
            >
              <TrendingUp />
            </Avatar>

            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: "1.65rem",
                    sm: "2rem",
                    md: "2.2rem",
                  },
                  fontWeight: 850,
                  letterSpacing: "-0.04em",
                  color: "#101828",
                }}
              >
                Deposit Money
              </Typography>

              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.9rem",
                  mt: 0.4,
                }}
              >
                Securely add funds to your bank account
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
          >
            <Chip
              icon={<Shield />}
              label="Protected"
              sx={{
                height: 36,
                borderRadius: 2,
                bgcolor: "#ecfdf3",
                color: "#027a48",
                border: "1px solid #abefc6",
                fontWeight: 750,
                "& .MuiChip-icon": {
                  color: "#12b76a",
                },
              }}
            />

            <Chip
              icon={<VerifiedUser />}
              label="Authenticated"
              sx={{
                height: 36,
                borderRadius: 2,
                bgcolor: "#eff8ff",
                color: "#175cd3",
                border: "1px solid #b2ddff",
                fontWeight: 750,
                "& .MuiChip-icon": {
                  color: "#2e90fa",
                },
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <Box
        sx={{
          maxWidth: 1320,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.65fr) minmax(330px, .75fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* =================================================
            MAIN FORM
        ================================================= */}

        <Card
          sx={{
            borderRadius: 3,
            border: "1px solid #e4e7ec",
            boxShadow:
              "0 10px 35px rgba(16,24,40,.06)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: {
                xs: 2,
                sm: 3,
              },
              py: 2.5,
              borderBottom: "1px solid #eaecf0",
              bgcolor: "#fff",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "#101828",
                  }}
                >
                  New Deposit
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    color: "#667085",
                    fontSize: ".82rem",
                  }}
                >
                  Complete the details below to add funds
                </Typography>
              </Box>

              <Chip
                size="small"
                label="STEP 1 OF 1"
                sx={{
                  display: {
                    xs: "none",
                    sm: "flex",
                  },
                  fontSize: ".65rem",
                  fontWeight: 800,
                  bgcolor: "#f9fafb",
                  border: "1px solid #eaecf0",
                }}
              />
            </Stack>
          </Box>

          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
                md: 4,
              },
            }}
          >
            {/* =================================================
                ACCOUNT
            ================================================= */}

            <Box sx={{ mb: 4 }}>
              <SectionHeading
                number="01"
                title="Destination Account"
                description="Select the account into which the money will be deposited."
              />

              <Box
                sx={{
                  mt: 2.5,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr auto",
                  },
                  gap: 1.5,
                }}
              >
                <TextField
                  fullWidth
                  label="Account ID"
                  value={accountId}
                  onChange={handleAccountChange}
                  placeholder="Enter account ID"
                  error={Boolean(errors.accountId)}
                  helperText={
                    errors.accountId ||
                    "Example: 10001"
                  }
                  disabled={loading || verifying}
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountBalance
                          sx={{
                            color: "#98a2b3",
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={inputStyles}
                />

                <Button
                  variant="outlined"
                  onClick={handleVerifyAccount}
                  disabled={
                    verifying ||
                    loading ||
                    !accountId
                  }
                  sx={{
                    minWidth: 125,
                    height: 56,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 750,
                    borderColor: "#d0d5dd",
                  }}
                >
                  {verifying ? (
                    <CircularProgress size={20} />
                  ) : accountVerified ? (
                    <Stack
                      direction="row"
                      spacing={0.7}
                      alignItems="center"
                    >
                      <CheckCircle
                        sx={{
                          fontSize: 18,
                          color: "#12b76a",
                        }}
                      />

                      Verified
                    </Stack>
                  ) : (
                    "Verify Account"
                  )}
                </Button>
              </Box>

              {/* =================================================
                  VERIFIED ACCOUNT
              ================================================= */}

              <Collapse in={accountVerified}>
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f6fef9",
                    borderColor: "#abefc6",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor: "#dcfae6",
                        color: "#039855",
                      }}
                    >
                      <CheckCircle />
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        fontWeight={800}
                        color="#027a48"
                      >
                        Account Ready
                      </Typography>

                      <Typography
                        variant="caption"
                        color="#475467"
                      >
                        Account ID{" "}
                        {accountId}{" "}
                        is ready for the deposit request.
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={
                        accountInfo?.status ||
                        accountInfo?.accountStatus ||
                        "ACTIVE"
                      }
                      sx={{
                        fontWeight: 800,
                        bgcolor: "#dcfae6",
                        color: "#027a48",
                      }}
                    />
                  </Stack>
                </Paper>
              </Collapse>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* =================================================
                AMOUNT
            ================================================= */}

            <Box sx={{ mb: 4 }}>
              <SectionHeading
                number="02"
                title="Deposit Amount"
                description="Specify the amount you want to add to the account."
              />

              <Box sx={{ mt: 2.5 }}>
                <TextField
                  fullWidth
                  label="Amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  error={Boolean(errors.amount)}
                  helperText={
                    errors.amount ||
                    `Daily deposit limit: ${formatCurrency(
                      dailyLimit
                    )}`
                  }
                  disabled={loading}
                  slotProps={{
                    htmlInput: {
                      inputMode: "decimal",
                      min: 1,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography
                          sx={{
                            fontWeight: 850,
                            fontSize: "1.15rem",
                            color: "#344054",
                          }}
                        >
                          ₹
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    ...inputStyles,

                    "& .MuiInputBase-input": {
                      fontSize: {
                        xs: "1.15rem",
                        sm: "1.3rem",
                      },
                      fontWeight: 800,
                    },
                  }}
                />

                {/* LIMIT */}

                <Box sx={{ mt: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 0.7 }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#667085"
                    >
                      Deposit limit usage
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color={
                        amountProgress >= 90
                          ? "#dc2626"
                          : "#344054"
                      }
                    >
                      {amountProgress.toFixed(0)}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={amountProgress}
                    sx={{
                      height: 7,
                      borderRadius: 10,
                      bgcolor: "#eaecf0",

                      "& .MuiLinearProgress-bar": {
                        borderRadius: 10,
                        bgcolor:
                          amountProgress >= 90
                            ? "#dc2626"
                            : "#12b76a",
                      },
                    }}
                  />
                </Box>

                {/* QUICK AMOUNTS */}

                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="#667085"
                    sx={{
                      display: "block",
                      mb: 1.2,
                      letterSpacing: ".04em",
                    }}
                  >
                    QUICK SELECT
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {[
                      500,
                      1000,
                      2000,
                      5000,
                      10000,
                      25000,
                    ].map((value) => (
                      <Button
                        key={value}
                        variant={
                          numericAmount === value
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() =>
                          handleQuickAmount(value)
                        }
                        disabled={loading}
                        sx={{
                          minWidth: {
                            xs: 75,
                            sm: 88,
                          },
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 750,

                          borderColor:
                            numericAmount === value
                              ? "#12b76a"
                              : "#d0d5dd",

                          bgcolor:
                            numericAmount === value
                              ? "#12b76a"
                              : "#fff",

                          color:
                            numericAmount === value
                              ? "#fff"
                              : "#344054",

                          "&:hover": {
                            bgcolor:
                              numericAmount === value
                                ? "#039855"
                                : "#f9fafb",
                          },
                        }}
                      >
                        ₹{formatNumber(value)}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* =================================================
                SUMMARY
            ================================================= */}

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 2.5,
                overflow: "hidden",
                bgcolor: "#fcfcfd",
                borderColor: "#eaecf0",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "#f9fafb",
                  borderBottom: "1px solid #eaecf0",
                }}
              >
                <Typography
                  fontSize=".78rem"
                  fontWeight={850}
                  color="#475467"
                >
                  TRANSACTION SUMMARY
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <SummaryRow
                  label="Destination account"
                  value={
                    accountId
                      ? `#${accountId}`
                      : "Not selected"
                  }
                />

                <SummaryRow
                  label="Transaction type"
                  value={
                    <Chip
                      size="small"
                      label="DEPOSIT"
                      sx={{
                        height: 25,
                        fontWeight: 800,
                        fontSize: ".65rem",
                        bgcolor: "#ecfdf3",
                        color: "#027a48",
                        border:
                          "1px solid #abefc6",
                      }}
                    />
                  }
                />

                <SummaryRow
                  label="Processing"
                  value="Instant"
                />

                <Divider sx={{ my: 1.5 }} />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    fontWeight={800}
                    color="#344054"
                  >
                    Total deposit
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: "1.25rem",
                      color: "#039855",
                    }}
                  >
                    {formatCurrency(numericAmount)}
                  </Typography>
                </Stack>
              </Box>
            </Paper>

            {/* SERVER ERROR */}

            {errors.submit && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                }}
              >
                {errors.submit}
              </Alert>
            )}

            {/* ACTIONS */}

            <Stack
              direction={{
                xs: "column-reverse",
                sm: "row",
              }}
              spacing={1.5}
              sx={{ mt: 3 }}
            >
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                sx={{
                  minHeight: 52,
                  flex: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 750,
                  borderColor: "#d0d5dd",
                  color: "#344054",
                }}
              >
                Clear Form
              </Button>

              <Button
                variant="contained"
                onClick={handleReview}
                disabled={
                  loading ||
                  verifying ||
                  !accountId ||
                  !amount ||
                  !isAmountValid
                }
                startIcon={<ReceiptLong />}
                sx={{
                  minHeight: 52,
                  flex: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#12b76a",
                  boxShadow:
                    "0 5px 14px rgba(18,183,106,.2)",

                  "&:hover": {
                    bgcolor: "#039855",
                  },
                }}
              >
                {accountVerified
                  ? "Review Deposit"
                  : "Verify & Review Deposit"}
              </Button>
            </Stack>

            {/* SECURITY */}

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{ mt: 2.5 }}
            >
              <Lock
                sx={{
                  fontSize: 15,
                  color: "#98a2b3",
                }}
              />

              <Typography
                variant="caption"
                color="#98a2b3"
              >
                Your transaction is protected by authenticated API access
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <Stack spacing={2.5}>
          {/* SECURITY CARD */}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #e4e7ec",
              boxShadow:
                "0 8px 25px rgba(16,24,40,.05)",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 2.5 }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#ecfdf3",
                    color: "#039855",
                  }}
                >
                  <Security />
                </Avatar>

                <Box>
                  <Typography
                    fontWeight={850}
                    color="#101828"
                  >
                    Security Center
                  </Typography>

                  <Typography
                    variant="caption"
                    color="#667085"
                  >
                    Transaction protection
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <SecurityRow
                  icon={<VerifiedUser />}
                  title="Authenticated"
                  description="Request requires valid authentication."
                />

                <SecurityRow
                  icon={<Shield />}
                  title="Protected"
                  description="Transaction is processed through the secure API."
                />

                <SecurityRow
                  icon={<Lock />}
                  title="Encrypted"
                  description="Sensitive transaction data is protected."
                />
              </Stack>
            </CardContent>
          </Card>

          {/* LIMIT CARD */}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #e4e7ec",
              boxShadow:
                "0 8px 25px rgba(16,24,40,.05)",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography
                    fontWeight={850}
                    color="#101828"
                  >
                    Deposit Limits
                  </Typography>

                  <Typography
                    variant="caption"
                    color="#667085"
                  >
                    Account transaction controls
                  </Typography>
                </Box>

                <Tooltip title="View deposit limits">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setShowLimits(
                        (previous) => !previous
                      )
                    }
                  >
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack spacing={1.7}>
                <LimitRow
                  label="Daily limit"
                  value={formatCurrency(dailyLimit)}
                />

                <LimitRow
                  label="Minimum"
                  value={formatCurrency(1)}
                />

                <LimitRow
                  label="Processing"
                  value="Instant"
                />
              </Stack>

              <Collapse in={showLimits}>
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                  }}
                >
                  Actual transaction limits may also
                  be enforced by the bank backend.
                </Alert>
              </Collapse>
            </CardContent>
          </Card>

          {/* INFORMATION */}

          <Card
            sx={{
              borderRadius: 3,
              bgcolor: "#f6fef9",
              border: "1px solid #abefc6",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#dcfae6",
                    color: "#039855",
                  }}
                >
                  <InfoOutlined />
                </Avatar>

                <Box>
                  <Typography
                    fontWeight={850}
                    color="#027a48"
                    sx={{ mb: 0.7 }}
                  >
                    Before you deposit
                  </Typography>

                  <Typography
                    variant="body2"
                    color="#05603a"
                    sx={{
                      lineHeight: 1.7,
                    }}
                  >
                    Verify the account ID and deposit
                    amount carefully before submitting
                    the transaction.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* ACTIVITY */}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #e4e7ec",
              boxShadow:
                "0 8px 25px rgba(16,24,40,.05)",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#eff8ff",
                    color: "#1570ef",
                  }}
                >
                  <History />
                </Avatar>

                <Box>
                  <Typography
                    fontWeight={850}
                  >
                    Transaction History
                  </Typography>

                  <Typography
                    variant="caption"
                    color="#667085"
                  >
                    Review completed deposits
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  sx={{ ml: "auto" }}
                  disabled
                >
                  <MoreHoriz />
                </IconButton>
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                disabled
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 750,
                }}
              >
                View Recent Deposits
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* =================================================
          REVIEW DIALOG
      ================================================= */}

      <Dialog
        open={reviewOpen}
        onClose={() => {
          if (!loading) {
            setReviewOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            borderBottom: "1px solid #eaecf0",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Avatar
              sx={{
                bgcolor: "#ecfdf3",
                color: "#039855",
              }}
            >
              <ReceiptLong />
            </Avatar>

            <Box>
              <Typography
                fontWeight={850}
                fontSize="1.15rem"
              >
                Review Deposit
              </Typography>

              <Typography
                variant="caption"
                color="#667085"
              >
                Verify the transaction before submitting
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 2.5,
                textAlign: "center",
                bgcolor: "#f6fef9",
              }}
            >
              <Typography
                variant="caption"
                color="#667085"
                fontWeight={700}
              >
                DEPOSIT AMOUNT
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#039855",
                }}
              >
                {formatCurrency(numericAmount)}
              </Typography>
            </Box>

            <Box sx={{ p: 2.5 }}>
              <SummaryRow
                label="Account ID"
                value={`#${accountId}`}
              />

              <SummaryRow
                label="Transaction type"
                value="Deposit"
              />

              <SummaryRow
                label="Processing"
                value="Instant"
              />

              <SummaryRow
                label="Status"
                value={
                  <Chip
                    size="small"
                    label="READY"
                    color="success"
                    sx={{
                      fontWeight: 800,
                    }}
                  />
                }
              />
            </Box>
          </Paper>

          <Alert
            severity="info"
            icon={<InfoOutlined />}
            sx={{
              mt: 2,
              borderRadius: 2,
            }}
          >
            Please verify the account and amount.
            The deposit will be submitted to the banking
            server immediately.
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            borderTop: "1px solid #eaecf0",
          }}
        >
          <Button
            onClick={() => setReviewOpen(false)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 750,
            }}
          >
            Go Back
          </Button>

          <Button
            variant="contained"
            onClick={handleDeposit}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <CheckCircle />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "#12b76a",

              "&:hover": {
                bgcolor: "#039855",
              },
            }}
          >
            {loading
              ? "Processing..."
              : "Confirm Deposit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          RECEIPT DIALOG
      ================================================= */}

      <Dialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 1.5,
              bgcolor: "#dcfae6",
              color: "#039855",
            }}
          >
            <CheckCircle
              sx={{
                fontSize: 34,
              }}
            />
          </Avatar>

          <Typography
            fontWeight={900}
            fontSize="1.35rem"
          >
            Deposit Successful
          </Typography>

          <Typography
            variant="body2"
            color="#667085"
            sx={{ mt: 0.5 }}
          >
            Your deposit has been processed successfully.
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          {result && (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: "#f6fef9",
                  borderColor: "#abefc6",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="#667085"
                  fontWeight={700}
                >
                  AMOUNT DEPOSITED
                </Typography>

                <Typography
                  sx={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: "#027a48",
                    mt: 0.3,
                  }}
                >
                  {formatCurrency(result.amount)}
                </Typography>
              </Paper>

              <Box sx={{ mt: 2.5 }}>
                <SummaryRow
                  label="Transaction ID"
                  value={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        fontWeight={750}
                      >
                        {result.transactionId}
                      </Typography>

                      <Tooltip title="Copy">
                        <IconButton
                          size="small"
                          onClick={copyTransactionId}
                        >
                          <ContentCopy
                            sx={{
                              fontSize: 16,
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />

                <SummaryRow
                  label="Account ID"
                  value={`#${result.accountId}`}
                />

                <SummaryRow
                  label="Date & Time"
                  value={new Date(
                    result.timestamp
                  ).toLocaleString("en-IN")}
                />

                <SummaryRow
                  label="Status"
                  value={
                    <Chip
                      size="small"
                      label="COMPLETED"
                      color="success"
                      icon={<CheckCircle />}
                      sx={{
                        fontWeight: 800,
                      }}
                    />
                  }
                />

                {result.balance !== null && (
                  <>
                    <Divider sx={{ my: 1.5 }} />

                    <SummaryRow
                      label="Available Balance"
                      value={
                        <Typography
                          fontWeight={900}
                          color="#027a48"
                        >
                          {formatCurrency(
                            result.balance
                          )}
                        </Typography>
                      }
                    />
                  </>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={printReceipt}
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 750,
            }}
          >
            Print Receipt
          </Button>

          <Button
            variant="contained"
            onClick={() => setReceiptOpen(false)}
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          TOAST
      ================================================= */}

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() =>
          setToast((previous) => ({
            ...previous,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={toast.type}
          variant="filled"
          icon={
            toast.type === "success" ? (
              <CheckCircle />
            ) : (
              <ErrorIcon />
            )
          }
          onClose={() =>
            setToast((previous) => ({
              ...previous,
              open: false,
            }))
          }
          sx={{
            borderRadius: 2,
            minWidth: {
              xs: "calc(100vw - 32px)",
              sm: 380,
            },
            fontWeight: 650,
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  number,
  title,
  description,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 1.5,
          bgcolor: "#f2f4f7",
          color: "#475467",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: ".75rem",
          fontWeight: 900,
        }}
      >
        {number}
      </Box>

      <Box>
        <Typography
          fontWeight={850}
          color="#101828"
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          color="#667085"
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{
        py: 0.8,
      }}
    >
      <Typography
        variant="body2"
        color="#667085"
      >
        {label}
      </Typography>

      <Box
        sx={{
          textAlign: "right",
          color: "#344054",
        }}
      >
        {typeof value === "string" ||
        typeof value === "number" ? (
          <Typography
            variant="body2"
            fontWeight={750}
          >
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

/* =========================================================
   SECURITY ROW
========================================================= */

function SecurityRow({
  icon,
  title,
  description,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="flex-start"
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 1.5,
          bgcolor: "#ecfdf3",
          color: "#039855",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          variant="body2"
          fontWeight={800}
          color="#344054"
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          color="#667085"
          sx={{
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

/* =========================================================
   LIMIT ROW
========================================================= */

function LimitRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography
        variant="body2"
        color="#667085"
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={800}
        color="#344054"
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   INPUT STYLES
========================================================= */

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
    transition: "all .18s ease",

    "& fieldset": {
      borderColor: "#d0d5dd",
    },

    "&:hover fieldset": {
      borderColor: "#98a2b3",
    },

    "&.Mui-focused fieldset": {
      borderWidth: "1.5px",
      borderColor: "#12b76a",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#667085",
    fontWeight: 500,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#039855",
  },

  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    marginTop: 0.7,
  },
};

export default Deposit;
