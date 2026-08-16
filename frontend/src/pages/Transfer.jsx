import { useEffect, useMemo, useState } from "react";

import {
  AccountBalance,
  AccountBalanceWallet,
  ArrowBack,
  ArrowForward,
  Check,
  CheckCircle,
  ChevronRight,
  Close,
  ContentCopy,
  History,
  Lock,
  Refresh,
  Search,
  Security,
  SwapHoriz,
  VerifiedUser,
  Warning,
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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import api from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getCustomerName = (account) => {
  if (!account) return "Unknown customer";

  if (account.customer?.name) {
    return account.customer.name;
  }

  if (account.customerName) {
    return account.customerName;
  }

  if (account.name) {
    return account.name;
  }

  return `Customer #${account.customerId || "—"}`;
};

const getAccountNumber = (account) =>
  account?.accountNumber ||
  account?.accountNo ||
  `Account #${account?.id || "—"}`;

const getAccountType = (account) =>
  account?.accountType ||
  account?.type ||
  "Bank Account";

const getBalance = (account) =>
  Number(account?.balance || 0);

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Transfer() {
  const [accounts, setAccounts] = useState([]);

  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState(null);

  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");

  const [amount, setAmount] = useState("");

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  const [showFromAccounts, setShowFromAccounts] =
    useState(false);

  const [showToAccounts, setShowToAccounts] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);

  const [result, setResult] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    type: "success",
    message: "",
  });

  /* =======================================================
     LOAD ACCOUNTS
  ======================================================= */

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);

      const response = await api.get("/accounts");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setAccounts(data);
    } catch (error) {
      console.error(
        "Failed to load accounts:",
        error
      );

      setNotification({
        open: true,
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to load bank accounts.",
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  /* =======================================================
     FILTERED ACCOUNTS
  ======================================================= */

  const filteredFromAccounts = useMemo(() => {
    const query = fromSearch.trim().toLowerCase();

    if (!query) return accounts;

    return accounts.filter((account) =>
      [
        account.id,
        account.accountNumber,
        account.accountNo,
        account.customerId,
        account.customer?.id,
        account.customer?.name,
        account.customerName,
        account.accountType,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [accounts, fromSearch]);

  const filteredToAccounts = useMemo(() => {
    const query = toSearch.trim().toLowerCase();

    if (!query) return accounts;

    return accounts.filter((account) =>
      [
        account.id,
        account.accountNumber,
        account.accountNo,
        account.customerId,
        account.customer?.id,
        account.customer?.name,
        account.customerName,
        account.accountType,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [accounts, toSearch]);

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  const validateTransfer = () => {
    const newErrors = {};

    if (!fromAccount) {
      newErrors.fromAccount =
        "Please select the sender account.";
    }

    if (!toAccount) {
      newErrors.toAccount =
        "Please select the receiver account.";
    }

    if (
      fromAccount &&
      toAccount &&
      Number(fromAccount.id) === Number(toAccount.id)
    ) {
      newErrors.toAccount =
        "Sender and receiver accounts must be different.";
    }

    const numericAmount = Number(amount);

    if (!amount) {
      newErrors.amount =
        "Please enter the transfer amount.";
    } else if (!Number.isFinite(numericAmount)) {
      newErrors.amount =
        "Please enter a valid amount.";
    } else if (numericAmount <= 0) {
      newErrors.amount =
        "Transfer amount must be greater than ₹0.";
    } else if (
      fromAccount &&
      numericAmount > getBalance(fromAccount)
    ) {
      newErrors.amount =
        "Insufficient balance in the sender account.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =======================================================
     AMOUNT
  ======================================================= */

  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (
      value === "" ||
      /^\d*\.?\d{0,2}$/.test(value)
    ) {
      setAmount(value);

      if (errors.amount) {
        setErrors((current) => ({
          ...current,
          amount: "",
        }));
      }
    }
  };

  /* =======================================================
     SELECT ACCOUNT
  ======================================================= */

  const handleFromAccount = (account) => {
    setFromAccount(account);
    setShowFromAccounts(false);
    setFromSearch("");

    setErrors((current) => ({
      ...current,
      fromAccount: "",
    }));
  };

  const handleToAccount = (account) => {
    setToAccount(account);
    setShowToAccounts(false);
    setToSearch("");

    setErrors((current) => ({
      ...current,
      toAccount: "",
    }));
  };

  /* =======================================================
     SWAP ACCOUNTS
  ======================================================= */

  const swapAccounts = () => {
    const sender = fromAccount;
    const receiver = toAccount;

    setFromAccount(receiver);
    setToAccount(sender);
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetTransfer = () => {
    setFromAccount(null);
    setToAccount(null);
    setFromSearch("");
    setToSearch("");
    setAmount("");
    setErrors({});
    setActiveStep(0);
  };

  /* =======================================================
     CONTINUE
  ======================================================= */

  const handleContinue = () => {
    if (activeStep === 0) {
      if (!fromAccount || !toAccount) {
        setErrors({
          fromAccount: !fromAccount
            ? "Select sender account."
            : "",
          toAccount: !toAccount
            ? "Select receiver account."
            : "",
        });

        return;
      }

      if (
        Number(fromAccount.id) ===
        Number(toAccount.id)
      ) {
        setErrors({
          toAccount:
            "Sender and receiver accounts must be different.",
        });

        return;
      }

      setActiveStep(1);
      return;
    }

    if (activeStep === 1) {
      if (!validateTransfer()) {
        return;
      }

      setActiveStep(2);
      return;
    }

    setConfirmOpen(true);
  };

  /* =======================================================
     TRANSFER
  ======================================================= */

  const handleTransfer = async () => {
    if (!validateTransfer()) {
      setConfirmOpen(false);
      return;
    }

    try {
      setProcessing(true);

      const response = await api.post(
        "/accounts/transfer",
        {
          fromAccountId: Number(fromAccount.id),
          toAccountId: Number(toAccount.id),
          amount: Number(amount),
        }
      );

      setResult(response.data || null);

      setConfirmOpen(false);
      setSuccessOpen(true);

      setNotification({
        open: true,
        type: "success",
        message:
          "Transfer completed successfully.",
      });

      setActiveStep(3);

      await loadAccounts();
    } catch (error) {
      console.error(
        "Transfer failed:",
        error
      );

      setConfirmOpen(false);

      setNotification({
        open: true,
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Transfer failed. Please verify the account details and available balance.",
      });
    } finally {
      setProcessing(false);
    }
  };

  /* =======================================================
     COPY
  ======================================================= */

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(
        String(text)
      );

      setNotification({
        open: true,
        type: "success",
        message: "Copied to clipboard.",
      });
    } catch {
      setNotification({
        open: true,
        type: "error",
        message: "Unable to copy.",
      });
    }
  };

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const transferAmount = Number(amount || 0);

  const fee = 0;

  const total = transferAmount + fee;

  const remainingBalance = fromAccount
    ? getBalance(fromAccount) - transferAmount
    : 0;

  const completionPercentage =
    activeStep === 0
      ? 33
      : activeStep === 1
      ? 66
      : activeStep >= 2
      ? 100
      : 100;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",
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
      <Box
        sx={{
          maxWidth: 1380,
          mx: "auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

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
          sx={{ mb: 3 }}
        >
          <Stack
            direction="row"
            spacing={1.8}
            alignItems="center"
          >
            <Avatar
              sx={{
                width: 58,
                height: 58,
                borderRadius: 2.5,
                bgcolor: "primary.main",
                boxShadow:
                  "0 10px 25px rgba(25,118,210,.22)",
              }}
            >
              <SwapHoriz />
            </Avatar>

            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  letterSpacing: "-.045em",
                  color: "#0f172a",
                  fontSize: {
                    xs: "1.65rem",
                    sm: "2rem",
                    md: "2.3rem",
                  },
                }}
              >
                Transfer Money
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.3 }}
              >
                Securely transfer funds between
                your bank accounts
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
          >
            <Tooltip title="Refresh accounts">
              <span>
                <IconButton
                  onClick={loadAccounts}
                  disabled={loadingAccounts}
                  sx={{
                    bgcolor: "#fff",
                    border:
                      "1px solid #e2e8f0",
                    boxShadow:
                      "0 2px 8px rgba(15,23,42,.04)",
                  }}
                >
                  <Refresh
                    sx={{
                      animation:
                        loadingAccounts
                          ? "spin 1s linear infinite"
                          : "none",
                      "@keyframes spin": {
                        from: {
                          transform:
                            "rotate(0deg)",
                        },
                        to: {
                          transform:
                            "rotate(360deg)",
                        },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            <Chip
              icon={<VerifiedUser />}
              label="Secure Banking"
              color="success"
              variant="outlined"
              sx={{
                height: 42,
                px: 0.5,
                fontWeight: 800,
                bgcolor: "#f0fdf4",
              }}
            />
          </Stack>
        </Stack>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e2e8f0",
            mb: 3,
            overflow: "hidden",
          }}
        >
          <Box sx={{ px: 3, pt: 2.5 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography
                  fontWeight={800}
                  color="#0f172a"
                >
                  Transfer workflow
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Complete each step to securely
                  transfer funds
                </Typography>
              </Box>

              <Typography
                variant="caption"
                fontWeight={800}
                color="primary.main"
              >
                {completionPercentage}%
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{
                height: 5,
                borderRadius: 10,
                mb: 2.5,
              }}
            />

            <Stepper
              activeStep={
                activeStep > 2 ? 2 : activeStep
              }
              alternativeLabel
              sx={{
                pb: 2,
                "& .MuiStepLabel-label": {
                  fontWeight: 700,
                  fontSize: ".78rem",
                },
              }}
            >
              {[
                "Select Accounts",
                "Enter Amount",
                "Review & Confirm",
              ].map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Card>

        {/* =================================================
            SUCCESS STATE
        ================================================= */}

        {activeStep === 3 ? (
          <SuccessTransfer
            fromAccount={fromAccount}
            toAccount={toAccount}
            amount={amount}
            result={result}
            onNewTransfer={resetTransfer}
            onCopy={copyText}
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1.7fr) minmax(330px,.8fr)",
              },
              gap: 3,
              alignItems: "start",
            }}
          >
            {/* =============================================
                MAIN WORKSPACE
            ============================================= */}

            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e2e8f0",
                boxShadow:
                  "0 8px 30px rgba(15,23,42,.055)",
              }}
            >
              {/* Card Header */}

              <Box
                sx={{
                  px: {
                    xs: 2,
                    sm: 3,
                  },
                  py: 2.5,
                  borderBottom:
                    "1px solid #e2e8f0",
                  background:
                    "linear-gradient(135deg,#fff,#f8fafc)",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                    >
                      {activeStep === 0
                        ? "Select Accounts"
                        : activeStep === 1
                        ? "Enter Transfer Amount"
                        : "Review Transfer"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: .4 }}
                    >
                      {activeStep === 0
                        ? "Choose the source and destination accounts."
                        : activeStep === 1
                        ? "Enter the amount you want to transfer."
                        : "Review all details before submitting."}
                    </Typography>
                  </Box>

                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      bgcolor: "#eff6ff",
                      color:
                        "primary.main",
                    }}
                  >
                    {activeStep === 0 ? (
                      <AccountBalance />
                    ) : activeStep === 1 ? (
                      <AccountBalanceWallet />
                    ) : (
                      <Check />
                    )}
                  </Avatar>
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
                {/* =========================================
                    STEP 1
                ========================================= */}

                {activeStep === 0 && (
                  <Stack spacing={3}>
                    <AccountSelector
                      title="From Account"
                      subtitle="Source account"
                      account={fromAccount}
                      search={fromSearch}
                      setSearch={setFromSearch}
                      accounts={
                        filteredFromAccounts
                      }
                      open={
                        showFromAccounts
                      }
                      setOpen={
                        setShowFromAccounts
                      }
                      onSelect={
                        handleFromAccount
                      }
                      error={
                        errors.fromAccount
                      }
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "center",
                        position:
                          "relative",
                        height: {
                          xs: 20,
                          sm: 30,
                        },
                      }}
                    >
                      <IconButton
                        onClick={swapAccounts}
                        disabled={
                          !fromAccount &&
                          !toAccount
                        }
                        sx={{
                          position:
                            "absolute",
                          zIndex: 2,
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          bgcolor: "#fff",
                          border:
                            "1px solid #dbe2ea",
                          boxShadow:
                            "0 4px 15px rgba(15,23,42,.08)",
                          "&:hover": {
                            bgcolor:
                              "#eff6ff",
                          },
                        }}
                      >
                        <SwapHoriz
                          color="primary"
                        />
                      </IconButton>

                      <Divider
                        sx={{
                          width: "100%",
                          position:
                            "absolute",
                          top: "50%",
                        }}
                      />
                    </Box>

                    <AccountSelector
                      title="To Account"
                      subtitle="Destination account"
                      account={toAccount}
                      search={toSearch}
                      setSearch={setToSearch}
                      accounts={
                        filteredToAccounts
                      }
                      open={
                        showToAccounts
                      }
                      setOpen={
                        setShowToAccounts
                      }
                      onSelect={
                        handleToAccount
                      }
                      error={
                        errors.toAccount
                      }
                    />
                  </Stack>
                )}

                {/* =========================================
                    STEP 2
                ========================================= */}

                {activeStep === 1 && (
                  <Stack spacing={3}>
                    <TransferRoute
                      fromAccount={
                        fromAccount
                      }
                      toAccount={toAccount}
                    />

                    <Divider />

                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        sx={{ mb: 1 }}
                      >
                        Transfer Amount
                      </Typography>

                      <TextField
                        fullWidth
                        value={amount}
                        onChange={
                          handleAmountChange
                        }
                        placeholder="0.00"
                        error={Boolean(
                          errors.amount
                        )}
                        helperText={
                          errors.amount ||
                          "Available balance is shown below."
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography
                                fontSize="1.25rem"
                                fontWeight={900}
                              >
                                ₹
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root":
                            {
                              minHeight: 72,
                              borderRadius: 2.5,
                              bgcolor:
                                "#f8fafc",
                              fontSize:
                                "1.55rem",
                              fontWeight: 900,
                            },
                        }}
                      />
                    </Box>

                    {fromAccount && (
                      <BalanceCard
                        account={
                          fromAccount
                        }
                        transferAmount={
                          transferAmount
                        }
                        remainingBalance={
                          remainingBalance
                        }
                      />
                    )}

                    <QuickAmounts
                      setAmount={setAmount}
                    />
                  </Stack>
                )}

                {/* =========================================
                    STEP 3
                ========================================= */}

                {activeStep === 2 && (
                  <Stack spacing={2.5}>
                    <ReviewCard
                      fromAccount={
                        fromAccount
                      }
                      toAccount={toAccount}
                      amount={
                        transferAmount
                      }
                      fee={fee}
                      total={total}
                    />

                    <Alert
                      severity="warning"
                      icon={<Warning />}
                      sx={{
                        borderRadius: 2.5,
                      }}
                    >
                      Please verify the sender,
                      receiver and amount before
                      confirming the transfer.
                    </Alert>
                  </Stack>
                )}

                {/* =========================================
                    NAVIGATION
                ========================================= */}

                <Stack
                  direction={{
                    xs: "column-reverse",
                    sm: "row",
                  }}
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ mt: 4 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={resetTransfer}
                    disabled={processing}
                    sx={{
                      minHeight: 48,
                      borderRadius: 2.5,
                      textTransform:
                        "none",
                      fontWeight: 800,
                    }}
                  >
                    Start Over
                  </Button>

                  <Stack
                    direction="row"
                    spacing={1.5}
                  >
                    {activeStep > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={
                          <ArrowBack />
                        }
                        onClick={() =>
                          setActiveStep(
                            (current) =>
                              current - 1
                          )
                        }
                        disabled={
                          processing
                        }
                        sx={{
                          minHeight: 48,
                          borderRadius: 2.5,
                          textTransform:
                            "none",
                          fontWeight: 800,
                        }}
                      >
                        Back
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      endIcon={
                        activeStep === 2 ? (
                          <Check />
                        ) : (
                          <ArrowForward />
                        )
                      }
                      onClick={
                        handleContinue
                      }
                      disabled={
                        processing ||
                        loadingAccounts
                      }
                      sx={{
                        minHeight: 48,
                        minWidth: 170,
                        borderRadius: 2.5,
                        textTransform:
                          "none",
                        fontWeight: 900,
                        boxShadow:
                          "0 8px 20px rgba(25,118,210,.2)",
                      }}
                    >
                      {activeStep === 0
                        ? "Continue"
                        : activeStep === 1
                        ? "Review Transfer"
                        : "Confirm Transfer"}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* =============================================
                SIDEBAR
            ============================================= */}

            <Stack spacing={2.5}>
              <SecurityCard />

              <TransferSummary
                fromAccount={
                  fromAccount
                }
                toAccount={toAccount}
                amount={transferAmount}
                fee={fee}
                total={total}
              />

              <RecentInfoCard
                accounts={accounts}
              />
            </Stack>
          </Box>
        )}
      </Box>

      {/* ===================================================
          CONFIRM DIALOG
      =================================================== */}

      <Dialog
        open={confirmOpen}
        onClose={() =>
          !processing &&
          setConfirmOpen(false)
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={900}
              >
                Confirm Transfer
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Review before processing
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setConfirmOpen(false)
              }
              disabled={processing}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: 3 }}
        >
          <ReviewCard
            fromAccount={fromAccount}
            toAccount={toAccount}
            amount={transferAmount}
            fee={fee}
            total={total}
          />

          <Alert
            severity="info"
            icon={<Lock />}
            sx={{
              mt: 2,
              borderRadius: 2.5,
            }}
          >
            This transaction will be submitted
            securely to the banking system.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="outlined"
            onClick={() =>
              setConfirmOpen(false)
            }
            disabled={processing}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleTransfer}
            disabled={processing}
            startIcon={
              processing ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <Check />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              minWidth: 160,
            }}
          >
            {processing
              ? "Processing..."
              : "Confirm & Transfer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================================================
          SNACKBAR
      =================================================== */}

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() =>
          setNotification(
            (current) => ({
              ...current,
              open: false,
            })
          )
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={notification.type}
          variant="filled"
          onClose={() =>
            setNotification(
              (current) => ({
                ...current,
                open: false,
              })
            )
          }
          sx={{
            borderRadius: 2.5,
            minWidth: {
              xs: "calc(100vw - 32px)",
              sm: 360,
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* =========================================================
   ACCOUNT SELECTOR
========================================================= */

function AccountSelector({
  title,
  subtitle,
  account,
  search,
  setSearch,
  accounts,
  open,
  setOpen,
  onSelect,
  error,
}) {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.2 }}
      >
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={900}
            color="#0f172a"
          >
            {title}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {subtitle}
          </Typography>
        </Box>

        {account && (
          <Chip
            size="small"
            label="Selected"
            color="success"
            icon={<Check />}
            variant="outlined"
          />
        )}
      </Stack>

      {account ? (
        <Paper
          elevation={0}
          sx={{
            border:
              "1px solid #bfdbfe",
            borderRadius: 2.5,
            p: 2,
            bgcolor: "#f8fbff",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Avatar
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2,
                bgcolor: "#dbeafe",
                color:
                  "primary.main",
              }}
            >
              <AccountBalance />
            </Avatar>

            <Box flex={1}>
              <Typography
                fontWeight={900}
              >
                {getAccountNumber(
                  account
                )}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {getCustomerName(
                  account
                )}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 0.5 }}
              >
                <Chip
                  size="small"
                  label={getAccountType(
                    account
                  )}
                  variant="outlined"
                />

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    alignSelf:
                      "center",
                  }}
                >
                  Balance{" "}
                  {formatCurrency(
                    getBalance(
                      account
                    )
                  )}
                </Typography>
              </Stack>
            </Box>

            <Tooltip title="Change account">
              <IconButton
                onClick={() =>
                  setOpen(true)
                }
              >
                <ChevronRight />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      ) : (
        <Box>
          <TextField
            fullWidth
            value={search}
            onFocus={() =>
              setOpen(true)
            }
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search account number, customer or ID..."
            error={Boolean(error)}
            helperText={error}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  minHeight: 58,
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                },
            }}
          />

          <Collapse in={open}>
            <AccountList
              accounts={accounts}
              onSelect={onSelect}
            />
          </Collapse>
        </Box>
      )}
    </Box>
  );
}

/* =========================================================
   ACCOUNT LIST
========================================================= */

function AccountList({
  accounts,
  onSelect,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1,
        border:
          "1px solid #e2e8f0",
        borderRadius: 2.5,
        overflow: "hidden",
        maxHeight: 300,
        overflowY: "auto",
      }}
    >
      {accounts.length === 0 ? (
        <Box
          sx={{
            py: 5,
            textAlign: "center",
          }}
        >
          <AccountBalance
            sx={{
              fontSize: 40,
              color: "text.disabled",
            }}
          />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            No accounts found.
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {accounts.map(
            (account, index) => (
              <ListItem
                key={
                  account.id ||
                  account.accountNumber ||
                  index
                }
                disablePadding
                divider
              >
                <ListItemButton
                  onClick={() =>
                    onSelect(
                      account
                    )
                  }
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&:hover": {
                      bgcolor:
                        "#f8fafc",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 1.5,
                      bgcolor:
                        "#eff6ff",
                      color:
                        "primary.main",
                    }}
                  >
                    <AccountBalance
                      sx={{
                        fontSize: 20,
                      }}
                    />
                  </Avatar>

                  <ListItemText
                    primary={
                      <Typography
                        fontWeight={800}
                      >
                        {getAccountNumber(
                          account
                        )}
                      </Typography>
                    }
                    secondary={
                      <>
                        {getCustomerName(
                          account
                        )}{" "}
                        •{" "}
                        {formatCurrency(
                          getBalance(
                            account
                          )
                        )}
                      </>
                    }
                  />

                  <ChevronRight
                    color="disabled"
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>
      )}
    </Paper>
  );
}

/* =========================================================
   TRANSFER ROUTE
========================================================= */

function TransferRoute({
  fromAccount,
  toAccount,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: "#f8fafc",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems="center"
        spacing={2}
      >
        <RouteAccount
          label="From"
          account={fromAccount}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#dbeafe",
              color:
                "primary.main",
            }}
          >
            <ArrowForward />
          </Avatar>
        </Box>

        <RouteAccount
          label="To"
          account={toAccount}
        />
      </Stack>
    </Paper>
  );
}

function RouteAccount({
  label,
  account,
}) {
  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
      >
        {label}
      </Typography>

      <Typography
        fontWeight={900}
        sx={{ mt: 0.3 }}
      >
        {getAccountNumber(
          account
        )}
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
      >
        {getCustomerName(account)}
      </Typography>
    </Box>
  );
}

/* =========================================================
   BALANCE CARD
========================================================= */

function BalanceCard({
  account,
  transferAmount,
  remainingBalance,
}) {
  const balance =
    getBalance(account);

  const percentage =
    balance > 0
      ? Math.min(
          100,
          (transferAmount /
            balance) *
            100
        )
      : 0;

  const insufficient =
    transferAmount > balance;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: insufficient
          ? "1px solid #fecaca"
          : "1px solid #dbeafe",
        bgcolor: insufficient
          ? "#fff7f7"
          : "#f8fbff",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Available balance
          </Typography>

          <Typography
            variant="h5"
            fontWeight={900}
            sx={{ mt: 0.3 }}
          >
            {formatCurrency(balance)}
          </Typography>
        </Box>

        <Avatar
          sx={{
            bgcolor: insufficient
              ? "#fee2e2"
              : "#dbeafe",
            color: insufficient
              ? "error.main"
              : "primary.main",
          }}
        >
          {insufficient ? (
            <Warning />
          ) : (
            <AccountBalanceWallet />
          )}
        </Avatar>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={percentage}
        color={
          insufficient
            ? "error"
            : "primary"
        }
        sx={{
          mt: 2,
          height: 7,
          borderRadius: 10,
        }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: 1 }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Transfer
        </Typography>

        <Typography
          variant="caption"
          fontWeight={800}
        >
          {formatCurrency(
            transferAmount
          )}
        </Typography>
      </Stack>

      {!insufficient && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 1.5,
          }}
        >
          Remaining balance:{" "}
          <strong>
            {formatCurrency(
              Math.max(
                remainingBalance,
                0
              )
            )}
          </strong>
        </Typography>
      )}
    </Paper>
  );
}

/* =========================================================
   QUICK AMOUNTS
========================================================= */

function QuickAmounts({
  setAmount,
}) {
  const values = [
    500,
    1000,
    5000,
    10000,
    25000,
  ];

  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
      >
        Quick amount
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 1 }}
      >
        {values.map((value) => (
          <Button
            key={value}
            variant="outlined"
            size="small"
            onClick={() =>
              setAmount(
                String(value)
              )
            }
            sx={{
              borderRadius: 2,
              textTransform:
                "none",
              fontWeight: 800,
            }}
          >
            ₹
            {value.toLocaleString(
              "en-IN"
            )}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function ReviewCard({
  fromAccount,
  toAccount,
  amount,
  fee,
  total,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border:
          "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: "#f8fafc",
          borderBottom:
            "1px solid #e2e8f0",
        }}
      >
        <Typography
          fontWeight={900}
        >
          Transfer Summary
        </Typography>
      </Box>

      <Box sx={{ p: 2.5 }}>
        <SummaryLine
          label="From account"
          value={getAccountNumber(
            fromAccount
          )}
        />

        <SummaryLine
          label="Sender"
          value={getCustomerName(
            fromAccount
          )}
        />

        <Divider sx={{ my: 1.5 }} />

        <SummaryLine
          label="To account"
          value={getAccountNumber(
            toAccount
          )}
        />

        <SummaryLine
          label="Receiver"
          value={getCustomerName(
            toAccount
          )}
        />

        <Divider sx={{ my: 1.5 }} />

        <SummaryLine
          label="Transfer amount"
          value={formatCurrency(
            amount
          )}
        />

        <SummaryLine
          label="Transfer fee"
          value={
            fee === 0
              ? "Free"
              : formatCurrency(fee)
          }
        />

        <Divider sx={{ my: 1.5 }} />

        <SummaryLine
          label="Total"
          value={formatCurrency(
            total
          )}
          strong
        />
      </Box>
    </Paper>
  );
}

/* =========================================================
   SUMMARY LINE
========================================================= */

function SummaryLine({
  label,
  value,
  strong = false,
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ py: 0.7 }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={strong ? 900 : 700}
        color={
          strong
            ? "primary.main"
            : "#334155"
        }
        sx={{
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   TRANSFER SUMMARY SIDEBAR
========================================================= */

function TransferSummary({
  fromAccount,
  toAccount,
  amount,
  fee,
  total,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border:
          "1px solid #e2e8f0",
        boxShadow:
          "0 6px 24px rgba(15,23,42,.045)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          fontWeight={900}
        >
          Transfer Summary
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Live transaction preview
        </Typography>

        <Box sx={{ mt: 2.5 }}>
          <MiniAccount
            label="FROM"
            account={fromAccount}
          />

          <Box
            sx={{
              ml: 2.2,
              height: 25,
              borderLeft:
                "1px dashed #cbd5e1",
            }}
          />

          <MiniAccount
            label="TO"
            account={toAccount}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <SummaryLine
          label="Amount"
          value={formatCurrency(
            amount
          )}
        />

        <SummaryLine
          label="Fee"
          value={
            fee === 0
              ? "Free"
              : formatCurrency(fee)
          }
        />

        <SummaryLine
          label="Total"
          value={formatCurrency(
            total
          )}
          strong
        />
      </CardContent>
    </Card>
  );
}

function MiniAccount({
  label,
  account,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="center"
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          bgcolor: "#eff6ff",
          color: "primary.main",
        }}
      >
        <AccountBalance
          sx={{ fontSize: 17 }}
        />
      </Avatar>

      <Box>
        <Typography
          variant="caption"
          fontWeight={800}
          color="text.secondary"
        >
          {label}
        </Typography>

        <Typography
          variant="body2"
          fontWeight={900}
        >
          {getAccountNumber(
            account
          )}
        </Typography>
      </Box>
    </Stack>
  );
}

/* =========================================================
   SECURITY CARD
========================================================= */

function SecurityCard() {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border:
          "1px solid #bbf7d0",
        background:
          "linear-gradient(135deg,#f0fdf4,#ffffff)",
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
              bgcolor: "#dcfce7",
              color: "#15803d",
            }}
          >
            <Security />
          </Avatar>

          <Box>
            <Typography
              fontWeight={900}
            >
              Secure Transfer
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Banking protection enabled
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1.7}>
          <SecurityRow
            title="Authenticated request"
            text="Your request is sent through the authenticated API."
          />

          <SecurityRow
            title="Account validation"
            text="Sender and receiver accounts are verified."
          />

          <SecurityRow
            title="Balance validation"
            text="Transfer amount is checked against available balance."
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function SecurityRow({
  title,
  text,
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="flex-start"
    >
      <CheckCircle
        sx={{
          fontSize: 19,
          color: "#16a34a",
          mt: 0.2,
        }}
      />

      <Box>
        <Typography
          variant="body2"
          fontWeight={800}
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          {text}
        </Typography>
      </Box>
    </Stack>
  );
}

/* =========================================================
   RECENT INFO
========================================================= */

function RecentInfoCard({
  accounts,
}) {
  const totalBalance =
    accounts.reduce(
      (sum, account) =>
        sum +
        getBalance(account),
      0
    );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border:
          "1px solid #e2e8f0",
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
              bgcolor: "#f1f5f9",
              color: "#475569",
            }}
          >
            <History />
          </Avatar>

          <Box>
            <Typography
              fontWeight={900}
            >
              Account Overview
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Available banking accounts
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <SummaryLine
          label="Total accounts"
          value={accounts.length}
        />

        <SummaryLine
          label="Combined balance"
          value={formatCurrency(
            totalBalance
          )}
          strong
        />
      </CardContent>
    </Card>
  );
}

/* =========================================================
   SUCCESS
========================================================= */

function SuccessTransfer({
  fromAccount,
  toAccount,
  amount,
  result,
  onNewTransfer,
  onCopy,
}) {
  const transactionId =
    result?.transactionId ||
    result?.id ||
    result?.transaction?.id ||
    "Completed";

  return (
    <Card
      elevation={0}
      sx={{
        maxWidth: 850,
        mx: "auto",
        borderRadius: 3,
        border:
          "1px solid #bbf7d0",
        overflow: "hidden",
        boxShadow:
          "0 15px 50px rgba(22,101,52,.08)",
      }}
    >
      <Box
        sx={{
          py: 5,
          px: 3,
          textAlign: "center",
          background:
            "linear-gradient(180deg,#f0fdf4,#ffffff)",
        }}
      >
        <Avatar
          sx={{
            width: 76,
            height: 76,
            mx: "auto",
            bgcolor: "#dcfce7",
            color: "#16a34a",
          }}
        >
          <CheckCircle
            sx={{ fontSize: 48 }}
          />
        </Avatar>

        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            mt: 2,
            letterSpacing: "-.035em",
          }}
        >
          Transfer Successful
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.7 }}
        >
          Your transfer has been submitted
          successfully.
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: "#f8fafc",
            border:
              "1px solid #e2e8f0",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Transaction ID
              </Typography>

              <Typography
                fontWeight={900}
                sx={{ mt: 0.3 }}
              >
                {transactionId}
              </Typography>
            </Box>

            <Tooltip title="Copy transaction ID">
              <IconButton
                onClick={() =>
                  onCopy(
                    transactionId
                  )
                }
              >
                <ContentCopy
                  fontSize="small"
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>

        <Box sx={{ mt: 2 }}>
          <SummaryLine
            label="From"
            value={getAccountNumber(
              fromAccount
            )}
          />

          <SummaryLine
            label="To"
            value={getAccountNumber(
              toAccount
            )}
          />

          <SummaryLine
            label="Amount"
            value={formatCurrency(
              amount
            )}
            strong
          />

          <SummaryLine
            label="Date"
            value={formatDate(
              result?.timestamp ||
                result?.createdAt
            )}
          />
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={onNewTransfer}
          startIcon={<SwapHoriz />}
          sx={{
            mt: 3,
            minHeight: 50,
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 900,
          }}
        >
          Make Another Transfer
        </Button>
      </CardContent>
    </Card>
  );
}

export default Transfer;