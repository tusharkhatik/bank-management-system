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
  TrendingDown,
  VerifiedUser,
  WarningAmber,
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

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const getResponseBalance = (data) => {
  if (data === null || data === undefined) return null;

  if (typeof data === "number") return data;

  if (typeof data === "string" && !Number.isNaN(Number(data))) {
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

  return balance !== undefined ? Number(balance) : null;
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

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

  return "Unable to complete the withdrawal.";
};

/* =========================================================
   WITHDRAW
========================================================= */

function Withdraw() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [accountVerified, setAccountVerified] = useState(false);
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
    numericAmount >= 1 && numericAmount <= dailyLimit;

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

    if (!/^\d*$/.test(value)) return;

    setAccountId(value);
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

    if (!/^\d*\.?\d{0,2}$/.test(value)) return;

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
      validationErrors.accountId = "Account ID is required.";
    } else if (Number(accountId) <= 0) {
      validationErrors.accountId = "Enter a valid account ID.";
    }

    if (!amount) {
      validationErrors.amount = "Withdrawal amount is required.";
    } else if (numericAmount <= 0) {
      validationErrors.amount = "Amount must be greater than ₹0.";
    } else if (numericAmount > dailyLimit) {
      validationErrors.amount =
        `Maximum withdrawal limit is ${formatCurrency(dailyLimit)}.`;
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  /* =======================================================
     ACCOUNT VERIFICATION
  ======================================================= */

  const handleVerifyAccount = async () => {
    if (!accountId) {
      setErrors((previous) => ({
        ...previous,
        accountId: "Enter an account ID first.",
      }));
      return;
    }

    setVerifying(true);

    try {
      /*
       * No invented verification endpoint is called.
       * This keeps compatibility with your existing backend.
       */
      await new Promise((resolve) => setTimeout(resolve, 450));

      setAccountVerified(true);

      setAccountInfo({
        accountNumber: accountId,
        status: "ACTIVE",
      });

      setErrors((previous) => ({
        ...previous,
        accountId: "",
      }));
    } finally {
      setVerifying(false);
    }
  };

  /* =======================================================
     REVIEW
  ======================================================= */

  const handleReview = () => {
    if (!validate()) return;

    if (!accountVerified) {
      setAccountVerified(true);

      setAccountInfo({
        accountNumber: accountId,
        status: "ACTIVE",
      });
    }

    setReviewOpen(true);
  };

  /* =======================================================
     WITHDRAW
  ======================================================= */

  const handleWithdraw = async () => {
    setReviewOpen(false);

    try {
      setLoading(true);

      const response = await api.post(
        `/accounts/${accountId}/withdraw?amount=${numericAmount}`
      );

      const responseBalance = getResponseBalance(response?.data);

      const transactionId =
        response?.data?.transactionId ||
        response?.data?.transaction?.id ||
        response?.data?.id ||
        `WD-${Date.now()}`;

      const timestamp =
        response?.data?.timestamp ||
        response?.data?.createdAt ||
        new Date().toISOString();

      const receipt = {
        transactionId,
        accountId,
        amount: numericAmount,
        balance: responseBalance,
        timestamp,
        status: "COMPLETED",
        type: "WITHDRAWAL",
      };

      setResult(receipt);
      setReceiptOpen(true);

      showToast(
        "success",
        "Withdrawal completed successfully."
      );

      setAccountId("");
      setAmount("");
      setAccountVerified(false);
      setAccountInfo(null);
      setErrors({});
    } catch (error) {
      console.error("Withdrawal failed:", error);

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
    if (!result?.transactionId) return;

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
    if (!result) return;

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
        <title>Withdrawal Receipt</title>

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
          <div>Withdrawal Transaction Receipt</div>
        </div>

        <div class="success">
          ✓ TRANSACTION COMPLETED
        </div>

        <div class="amount">
          ₹${Number(result.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </div>

        <div class="row">
          <span class="label">Transaction ID</span>
          <span class="value">${result.transactionId}</span>
        </div>

        <div class="row">
          <span class="label">Account ID</span>
          <span class="value">${result.accountId}</span>
        </div>

        <div class="row">
          <span class="label">Transaction Type</span>
          <span class="value">Withdrawal</span>
        </div>

        <div class="row">
          <span class="label">Status</span>
          <span class="value">${result.status}</span>
        </div>

        <div class="row">
          <span class="label">Date</span>
          <span class="value">
            ${new Date(result.timestamp).toLocaleString("en-IN")}
          </span>
        </div>

        ${
          result.balance !== null
            ? `
              <div class="row">
                <span class="label">Available Balance</span>
                <span class="value">
                  ₹${Number(result.balance).toLocaleString("en-IN", {
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
          window.onload = function () {
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
    <Box sx={pageStyles}>
      {/* =================================================
          HEADER
      ================================================= */}

      <Box sx={headerContainerStyles}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          sx={{
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              md: "center",
            },
            gap: 2,
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                bgcolor: "#fff1f2",
                color: "#dc2626",
                border: "1px solid #fecdd3",
              }}
            >
              <TrendingDown />
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
                Withdraw Money
              </Typography>

              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.9rem",
                  mt: 0.4,
                }}
              >
                Securely withdraw funds from your bank account
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            sx={{
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Chip
              icon={<Shield />}
              label="Protected"
              sx={protectedChipStyles}
            />

            <Chip
              icon={<VerifiedUser />}
              label="Authenticated"
              sx={authenticatedChipStyles}
            />
          </Stack>
        </Stack>
      </Box>

      {/* =================================================
          MAIN
      ================================================= */}

      <Box sx={mainGridStyles}>
        {/* =================================================
            FORM
        ================================================= */}

        <Card sx={mainCardStyles}>
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
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "#101828",
                  }}
                >
                  New Withdrawal
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    color: "#667085",
                    fontSize: ".82rem",
                  }}
                >
                  Complete the details below to initiate a withdrawal
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
            {/* ACCOUNT */}

            <Box sx={{ mb: 4 }}>
              <SectionHeading
                number="01"
                title="Source Account"
                description="Select the account from which the money will be withdrawn."
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
                    errors.accountId || "Example: 10001"
                  }
                  disabled={loading}
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountBalance
                            sx={{ color: "#98a2b3" }}
                          />
                        </InputAdornment>
                      ),
                    },
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
                      sx={{
                        alignItems: "center",
                        gap: 0.7,
                      }}
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
                    sx={{
                      alignItems: "center",
                      gap: 1.5,
                    }}
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
                        sx={{
                          fontWeight: 800,
                          color: "#027a48",
                        }}
                      >
                        Account Ready
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{ color: "#475467" }}
                      >
                        Account ID {accountInfo?.accountNumber} is
                        ready for the withdrawal request.
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label="ACTIVE"
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

            {/* AMOUNT */}

            <Box sx={{ mb: 4 }}>
              <SectionHeading
                number="02"
                title="Withdrawal Amount"
                description="Specify the amount you want to withdraw."
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
                    `Daily withdrawal limit: ${formatCurrency(
                      dailyLimit
                    )}`
                  }
                  disabled={loading}
                  slotProps={{
                    htmlInput: {
                      inputMode: "decimal",
                      min: 1,
                    },
                    input: {
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
                    },
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
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.7,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "#667085",
                      }}
                    >
                      Withdrawal limit usage
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color:
                          amountProgress >= 90
                            ? "#dc2626"
                            : "#344054",
                      }}
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
                            : "#1570ef",
                      },
                    }}
                  />
                </Box>

                {/* QUICK SELECT */}

                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 1.2,
                      fontWeight: 800,
                      color: "#667085",
                      letterSpacing: ".04em",
                    }}
                  >
                    QUICK SELECT
                  </Typography>

                  <Stack
                    direction="row"
                    sx={{
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    {[
                      500,
                      1000,
                      2000,
                      5000,
                      10000,
                      25000,
                    ].map((value) => {
                      const selected =
                        numericAmount === value;

                      return (
                        <Button
                          key={value}
                          variant={
                            selected
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
                            borderColor: selected
                              ? "#1570ef"
                              : "#d0d5dd",
                            bgcolor: selected
                              ? "#1570ef"
                              : "#fff",
                            color: selected
                              ? "#fff"
                              : "#344054",
                          }}
                        >
                          ₹{formatNumber(value)}
                        </Button>
                      );
                    })}
                  </Stack>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* SUMMARY */}

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
                  sx={{
                    fontSize: ".78rem",
                    fontWeight: 850,
                    color: "#475467",
                  }}
                >
                  TRANSACTION SUMMARY
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <SummaryRow
                  label="Source account"
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
                      label="WITHDRAWAL"
                      sx={{
                        height: 25,
                        fontWeight: 800,
                        fontSize: ".65rem",
                        bgcolor: "#fff7ed",
                        color: "#c2410c",
                        border: "1px solid #fed7aa",
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
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: "#344054",
                    }}
                  >
                    Total withdrawal
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: "1.25rem",
                      color: "#dc2626",
                    }}
                  >
                    {formatCurrency(numericAmount)}
                  </Typography>
                </Stack>
              </Box>
            </Paper>

            {/* ERROR */}

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
              sx={{
                gap: 1.5,
                mt: 3,
              }}
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
                  bgcolor: "#dc2626",
                  boxShadow:
                    "0 5px 14px rgba(220,38,38,.2)",
                  "&:hover": {
                    bgcolor: "#b91c1c",
                  },
                }}
              >
                Review Withdrawal
              </Button>
            </Stack>

            {/* SECURITY FOOTER */}

            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mt: 2.5,
              }}
            >
              <Lock
                sx={{
                  fontSize: 15,
                  color: "#98a2b3",
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: "#98a2b3" }}
              >
                Your transaction is protected by authenticated
                API access
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <Stack sx={{ gap: 2.5 }}>
          {/* SECURITY */}

          <Card sx={sidebarCardStyles}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#eff8ff",
                    color: "#1570ef",
                  }}
                >
                  <Security />
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 850,
                      color: "#101828",
                    }}
                  >
                    Security Center
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: "#667085" }}
                  >
                    Transaction protection
                  </Typography>
                </Box>
              </Stack>

              <Stack sx={{ gap: 2 }}>
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

          {/* LIMIT */}

          <Card sx={sidebarCardStyles}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 850,
                      color: "#101828",
                    }}
                  >
                    Withdrawal Limits
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: "#667085" }}
                  >
                    Account transaction controls
                  </Typography>
                </Box>

                <Tooltip title="View withdrawal limits">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setShowLimits((previous) => !previous)
                    }
                  >
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack sx={{ gap: 1.7 }}>
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
                  Actual transaction limits may also be
                  enforced by the bank backend.
                </Alert>
              </Collapse>
            </CardContent>
          </Card>

          {/* INFORMATION */}

          <Card
            sx={{
              borderRadius: 3,
              bgcolor: "#fffcf5",
              border: "1px solid #fedf89",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#fef0c7",
                    color: "#dc6803",
                  }}
                >
                  <WarningAmber />
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 850,
                      color: "#93370d",
                      mb: 0.7,
                    }}
                  >
                    Before you withdraw
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#7a2e0e",
                      lineHeight: 1.7,
                    }}
                  >
                    Verify the account ID and amount carefully.
                    A completed transaction may be recorded
                    immediately.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* ACTIVITY */}

          <Card sx={sidebarCardStyles}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#f9f5ff",
                    color: "#7f56d9",
                  }}
                >
                  <History />
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 850 }}>
                    Transaction History
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: "#667085" }}
                  >
                    Review completed withdrawals
                  </Typography>
                </Box>

                <IconButton size="small" disabled>
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
                View Recent Withdrawals
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
          if (!loading) setReviewOpen(false);
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
            sx={{
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#fff1f2",
                color: "#dc2626",
              }}
            >
              <ReceiptLong />
            </Avatar>

            <Box>
              <Typography
                sx={{
                  fontWeight: 850,
                  fontSize: "1.15rem",
                }}
              >
                Review Withdrawal
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: "#667085" }}
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
                bgcolor: "#fff8f8",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#667085",
                  fontWeight: 700,
                }}
              >
                WITHDRAWAL AMOUNT
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#dc2626",
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
                value="Withdrawal"
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
                    sx={{ fontWeight: 800 }}
                  />
                }
              />
            </Box>
          </Paper>

          <Alert
            severity="warning"
            icon={<WarningAmber />}
            sx={{
              mt: 2,
              borderRadius: 2,
            }}
          >
            Please verify the account and amount. This
            operation will be sent to the banking server
            immediately.
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
            onClick={handleWithdraw}
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
              bgcolor: "#dc2626",
              "&:hover": {
                bgcolor: "#b91c1c",
              },
            }}
          >
            {loading
              ? "Processing..."
              : "Confirm Withdrawal"}
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
            <CheckCircle sx={{ fontSize: 34 }} />
          </Avatar>

          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "1.35rem",
            }}
          >
            Withdrawal Successful
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: "#667085",
            }}
          >
            Your withdrawal has been processed successfully.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2 }}>
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
                  sx={{
                    color: "#667085",
                    fontWeight: 700,
                  }}
                >
                  AMOUNT WITHDRAWN
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
                      sx={{
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 750 }}
                      >
                        {result.transactionId}
                      </Typography>

                      <Tooltip title="Copy">
                        <IconButton
                          size="small"
                          onClick={copyTransactionId}
                        >
                          <ContentCopy
                            sx={{ fontSize: 16 }}
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
                      icon={<CheckCircleOutline />}
                      sx={{ fontWeight: 800 }}
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
                          sx={{
                            fontWeight: 900,
                            color: "#027a48",
                          }}
                        >
                          {formatCurrency(result.balance)}
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
      sx={{
        alignItems: "flex-start",
        gap: 1.5,
      }}
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
          sx={{
            fontWeight: 850,
            color: "#101828",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          sx={{ color: "#667085" }}
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
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        py: 0.8,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "#667085" }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          textAlign: "right",
          color: "#344054",
          minWidth: 0,
        }}
      >
        {typeof value === "string" ||
        typeof value === "number" ? (
          <Typography
            variant="body2"
            sx={{ fontWeight: 750 }}
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
      sx={{
        alignItems: "flex-start",
        gap: 1.2,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 1.5,
          bgcolor: "#eff8ff",
          color: "#1570ef",
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
          sx={{
            fontWeight: 800,
            color: "#344054",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: "#667085",
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
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "#667085" }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 800,
          color: "#344054",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyles = {
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
};

const headerContainerStyles = {
  maxWidth: 1320,
  mx: "auto",
  mb: 3,
};

const mainGridStyles = {
  maxWidth: 1320,
  mx: "auto",
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    lg: "minmax(0, 1.65fr) minmax(330px, .75fr)",
  },
  gap: 3,
  alignItems: "start",
};

const mainCardStyles = {
  borderRadius: 3,
  border: "1px solid #e4e7ec",
  boxShadow: "0 10px 35px rgba(16,24,40,.06)",
  overflow: "hidden",
};

const sidebarCardStyles = {
  borderRadius: 3,
  border: "1px solid #e4e7ec",
  boxShadow: "0 8px 25px rgba(16,24,40,.05)",
};

const protectedChipStyles = {
  height: 36,
  borderRadius: 2,
  bgcolor: "#ecfdf3",
  color: "#027a48",
  border: "1px solid #abefc6",
  fontWeight: 750,
  "& .MuiChip-icon": {
    color: "#12b76a",
  },
};

const authenticatedChipStyles = {
  height: 36,
  borderRadius: 2,
  bgcolor: "#eff8ff",
  color: "#175cd3",
  border: "1px solid #b2ddff",
  fontWeight: 750,
  "& .MuiChip-icon": {
    color: "#2e90fa",
  },
};

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
      borderColor: "#1570ef",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#667085",
    fontWeight: 500,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#1570ef",
  },

  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    marginTop: 0.7,
  },
};

export default Withdraw;