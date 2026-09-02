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

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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
  /* -------------------------------------------------------
     ACCOUNT STATE
  ------------------------------------------------------- */

  const [accounts, setAccounts] = useState([]);

  const [fromAccount, setFromAccount] = useState(null);

  const [toAccount, setToAccount] = useState(null);

  const [toAccountNumber, setToAccountNumber] =
    useState("");

  const [fromSearch, setFromSearch] = useState("");

  const [amount, setAmount] = useState("");

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

  const [loadingAccounts, setLoadingAccounts] =
    useState(true);

  const [loadingReceiver, setLoadingReceiver] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [activeStep, setActiveStep] = useState(0);

  const [showFromAccounts, setShowFromAccounts] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] =
    useState(false);

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
     FILTER SENDER ACCOUNTS
  ======================================================= */

  const filteredFromAccounts = useMemo(() => {
    const query = fromSearch.trim().toLowerCase();

    if (!query) {
      return accounts;
    }

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
        account.status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [accounts, fromSearch]);

  /* =======================================================
     CAN SWAP
  ======================================================= */

  const canSwapAccounts =
    Boolean(fromAccount && toAccount) &&
    accounts.some(
      (account) =>
        Number(account.id) ===
        Number(toAccount.id)
    );

  /* =======================================================
     SELECT SENDER ACCOUNT
  ======================================================= */

  const handleFromAccount = (account) => {
    setFromAccount(account);

    setShowFromAccounts(false);

    setFromSearch("");

    if (
      account &&
      toAccount &&
      Number(account.id) ===
        Number(toAccount.id)
    ) {
      setToAccount(null);
      setToAccountNumber("");

      setErrors((current) => ({
        ...current,
        fromAccount: "",
        toAccount:
          "Sender and receiver accounts must be different.",
      }));

      return;
    }

    setErrors((current) => ({
      ...current,
      fromAccount: "",
      toAccount: "",
    }));
  };

  /* =======================================================
     VERIFY RECEIVER
     
     IMPORTANT:
     Receiver is verified by account number.

     API:
     GET /api/accounts/lookup?accountNumber=9876543210
  ======================================================= */

  const lookupReceiver = async () => {
    const accountNumber =
      toAccountNumber.trim();

      console.log("========== RECEIVER ROOT DEBUG ==========");
console.log("toAccountNumber:", toAccountNumber);
console.log("trimmed:", toAccountNumber.trim());
console.log("fromAccount:", fromAccount);
console.log("toAccount:", toAccount);
console.log("=========================================");
    /* -----------------------------------------------------
       VALIDATE EMPTY
    ----------------------------------------------------- */

    if (!accountNumber) {
      setToAccount(null);

      setErrors((current) => ({
        ...current,
        toAccount:
          "Please enter receiver account number.",
      }));

      return;
    }

    /* -----------------------------------------------------
       VALIDATE 10 DIGITS
    ----------------------------------------------------- */

    if (!/^\d{10}$/.test(accountNumber)) {
      setToAccount(null);

      setErrors((current) => ({
        ...current,
        toAccount:
          "Account number must be exactly 10 digits.",
      }));

      return;
    }

    /* -----------------------------------------------------
       SAME ACCOUNT CHECK
    ----------------------------------------------------- */

    if (
      fromAccount &&
      accountNumber ===
        String(
          fromAccount.accountNumber ||
            fromAccount.accountNo ||
            ""
        )
    ) {
      setToAccount(null);

      setErrors((current) => ({
        ...current,
        toAccount:
          "Sender and receiver accounts must be different.",
      }));

      return;
    }

    try {
      setLoadingReceiver(true);

      setToAccount(null);

      setErrors((current) => ({
        ...current,
        toAccount: "",
      }));

      console.log(
        "========== RECEIVER LOOKUP =========="
      );

      console.log(
        "Account Number:",
        accountNumber
      );

      console.log(
        "Request:",
        `/accounts/lookup?accountNumber=${accountNumber}`
      );

      /* ---------------------------------------------------
         API CALL
      --------------------------------------------------- */

      const response = await api.get(
        "/accounts/lookup",
        {
          params: {
            accountNumber: accountNumber,
          },
        }
      );

      console.log(
        "Receiver API Response:",
        response.data
      );

      const receiver = response.data;

      /* ---------------------------------------------------
         RESPONSE VALIDATION
      --------------------------------------------------- */

      if (!receiver) {
        throw new Error(
          "Receiver account not found."
        );
      }

      /* ---------------------------------------------------
         ACTIVE ACCOUNT CHECK
      --------------------------------------------------- */

      if (
        receiver.status &&
        receiver.status !== "ACTIVE"
      ) {
        setToAccount(null);

        setErrors((current) => ({
          ...current,
          toAccount:
            "Receiver account is not active.",
        }));

        return;
      }

      /* ---------------------------------------------------
         SAME ID CHECK
      --------------------------------------------------- */

      if (
        fromAccount &&
        Number(fromAccount.id) ===
          Number(receiver.id)
      ) {
        setToAccount(null);

        setErrors((current) => ({
          ...current,
          toAccount:
            "Sender and receiver accounts must be different.",
        }));

        return;
      }

      /* ---------------------------------------------------
         SUCCESS
      --------------------------------------------------- */

      setToAccount(receiver);

      setErrors((current) => ({
        ...current,
        toAccount: "",
      }));

      setNotification({
        open: true,
        type: "success",
        message:
          "Receiver account verified successfully.",
      });

      console.log(
        "Receiver verified:",
        receiver
      );

      console.log(
        "======================================"
      );
    } catch (error) {
      console.error(
        "Receiver lookup failed:",
        error
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      setToAccount(null);

      setErrors((current) => ({
        ...current,
        toAccount:
          error?.response?.data?.message ||
          "Receiver account not found.",
      }));
    } finally {
      setLoadingReceiver(false);
    }
  };

  /* =======================================================
     CHANGE RECEIVER NUMBER
     
     ONLY NUMBERS
     MAX 10 DIGITS
  ======================================================= */

  const handleReceiverNumberChange = (
    value
  ) => {
    /* Only digits */
    if (!/^\d*$/.test(value)) {
      return;
    }

    /* Maximum 10 digits */
    if (value.length > 10) {
      return;
    }

    setToAccountNumber(value);

    /* Changing number invalidates old verification */
    if (toAccount) {
      setToAccount(null);
    }

    if (errors.toAccount) {
      setErrors((current) => ({
        ...current,
        toAccount: "",
      }));
    }
  };

  /* =======================================================
     CLEAR RECEIVER
  ======================================================= */

  const clearReceiver = () => {
    setToAccount(null);

    setToAccountNumber("");

    setErrors((current) => ({
      ...current,
      toAccount: "",
    }));
  };

  /* =======================================================
     SWAP ACCOUNTS
  ======================================================= */

  const swapAccounts = () => {
    if (!canSwapAccounts) {
      return;
    }

    const sender = fromAccount;
    const receiver = toAccount;

    setFromAccount(receiver);

    setToAccount(sender);

    setToAccountNumber(
      sender?.accountNumber ||
        sender?.accountNo ||
        ""
    );

    setErrors((current) => ({
      ...current,
      fromAccount: "",
      toAccount: "",
    }));
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
     VALIDATION
  ======================================================= */

  const validateTransfer = () => {
    const newErrors = {};

    if (!fromAccount) {
      newErrors.fromAccount =
        "Please select the sender account.";
    }

    if (!toAccount) {
      newErrors.toAccount =
        "Please verify the receiver account.";
    }

    if (
      fromAccount &&
      toAccount &&
      Number(fromAccount.id) ===
        Number(toAccount.id)
    ) {
      newErrors.toAccount =
        "Sender and receiver accounts must be different.";
    }

    const numericAmount = Number(amount);

    if (!amount) {
      newErrors.amount =
        "Please enter the transfer amount.";
    } else if (
      !Number.isFinite(numericAmount)
    ) {
      newErrors.amount =
        "Please enter a valid amount.";
    } else if (numericAmount <= 0) {
      newErrors.amount =
        "Transfer amount must be greater than ₹0.";
    } else if (
      fromAccount &&
      numericAmount >
        getBalance(fromAccount)
    ) {
      newErrors.amount =
        "Insufficient balance in the sender account.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetTransfer = () => {
    setFromAccount(null);
    setToAccount(null);
    setFromSearch("");
    setToAccountNumber("");
    setAmount("");
    setErrors({});
    setActiveStep(0);
    setResult(null);
  };

  /* =======================================================
     NEXT STEP
  ======================================================= */

  const handleContinue = () => {
    if (activeStep === 0) {
      const newErrors = {};

      if (!fromAccount) {
        newErrors.fromAccount =
          "Select sender account.";
      }

      if (!toAccount) {
        newErrors.toAccount =
          "Verify receiver account.";
      }

      if (
        fromAccount &&
        toAccount &&
        Number(fromAccount.id) ===
          Number(toAccount.id)
      ) {
        newErrors.toAccount =
          "Sender and receiver accounts must be different.";
      }

      setErrors(newErrors);

      if (
        Object.keys(newErrors).length > 0
      ) {
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
     BACK
  ======================================================= */

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(
        (current) => current - 1
      );
    }
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
          fromAccountId: Number(
            fromAccount.id
          ),
          toAccountId: Number(
            toAccount.id
          ),
          amount: Number(amount),
        }
      );

      setResult(response.data || null);

      setConfirmOpen(false);

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
     CALCULATIONS
  ======================================================= */

  const transferAmount =
    Number(amount || 0);

  const fee = 0;

  const total =
    transferAmount + fee;

  const remainingBalance =
    fromAccount
      ? getBalance(fromAccount) -
        transferAmount
      : 0;

  const completionPercentage =
    activeStep === 0
      ? 33
      : activeStep === 1
      ? 66
      : 100;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        p: { xs: 2, md: 3 },
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          mb: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Avatar
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                bgcolor: "#0f172a",
              }}
            >
              <SwapHoriz />
            </Avatar>

            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
                color="#0f172a"
              >
                Transfer Money
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Securely transfer funds to a
                verified bank account
              </Typography>
            </Box>
          </Stack>

          <Chip
            icon={<Security />}
            label="Secure Banking"
            color="success"
            variant="outlined"
            sx={{
              fontWeight: 800,
              borderRadius: 2,
            }}
          />
        </Stack>
      </Box>

      {/* MAIN */}

      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        {/* PROGRESS */}

        <Card
          elevation={0}
          sx={{
            mb: 3,
            border:
              "1px solid #e2e8f0",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  fontWeight={900}
                  color="#0f172a"
                >
                  Transfer Progress
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {completionPercentage}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={
                  completionPercentage
                }
                sx={{
                  height: 7,
                  borderRadius: 5,
                }}
              />

              <Stepper
                activeStep={
                  activeStep >= 3
                    ? 2
                    : activeStep
                }
              >
                <Step>
                  <StepLabel>
                    Select Accounts
                  </StepLabel>
                </Step>

                <Step>
                  <StepLabel>
                    Enter Amount
                  </StepLabel>
                </Step>

                <Step>
                  <StepLabel>
                    Review & Confirm
                  </StepLabel>
                </Step>
              </Stepper>
            </Stack>
          </CardContent>
        </Card>

        {/* SUCCESS */}

        {activeStep === 3 ? (
          <SuccessTransfer
            result={result}
            fromAccount={fromAccount}
            toAccount={toAccount}
            amount={transferAmount}
            onReset={resetTransfer}
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) 360px",
              },
              gap: 3,
              alignItems: "start",
            }}
          >
            {/* WORKSPACE */}

            <Card
              elevation={0}
              sx={{
                border:
                  "1px solid #e2e8f0",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2,
                    md: 4,
                  },
                }}
              >
                {/* STEP 0 */}

                {activeStep === 0 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        color="#0f172a"
                      >
                        Select Transfer Accounts
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Select your source account
                        and verify the destination
                        account.
                      </Typography>
                    </Box>

                    <AccountSelector
                      title="From Account"
                      subtitle="Source account"
                      account={fromAccount}
                      search={fromSearch}
                      setSearch={
                        setFromSearch
                      }
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
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <IconButton
                        onClick={
                          swapAccounts
                        }
                        disabled={
                          !canSwapAccounts ||
                          processing
                        }
                        sx={{
                          border:
                            "1px solid #cbd5e1",
                        }}
                      >
                        <SwapHoriz />
                      </IconButton>

                      <Divider sx={{ flex: 1 }} />
                    </Box>

                    <ReceiverSelector
                      account={toAccount}
                      accountNumber={
                        toAccountNumber
                      }
                      setAccountNumber={
                        handleReceiverNumberChange
                      }
                      onVerify={
                        lookupReceiver
                      }
                      loading={
                        loadingReceiver
                      }
                      error={
                        errors.toAccount
                      }
                      onClear={
                        clearReceiver
                      }
                    />
                  </Stack>
                )}

                {/* STEP 1 */}

                {activeStep === 1 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        color="#0f172a"
                      >
                        Enter Transfer Amount
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Enter the amount you
                        want to transfer.
                      </Typography>
                    </Box>

                    <TransferRoute
                      fromAccount={
                        fromAccount
                      }
                      toAccount={
                        toAccount
                      }
                    />

                    <TextField
                      fullWidth
                      label="Transfer Amount"
                      value={amount}
                      onChange={
                        handleAmountChange
                      }
                      error={Boolean(
                        errors.amount
                      )}
                      helperText={
                        errors.amount ||
                        "Enter an amount up to 2 decimal places."
                      }
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root":
                          {
                            borderRadius: 2.5,
                            minHeight: 60,
                          },
                      }}
                    />

                    <BalanceCard
                      account={
                        fromAccount
                      }
                      amount={
                        transferAmount
                      }
                      remaining={
                        remainingBalance
                      }
                    />

                    <QuickAmounts
                      onSelect={(value) =>
                        setAmount(
                          String(value)
                        )
                      }
                    />
                  </Stack>
                )}

                {/* STEP 2 */}

                {activeStep === 2 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        color="#0f172a"
                      >
                        Review & Confirm
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Please verify the transfer
                        details before confirming.
                      </Typography>
                    </Box>

                    <ReviewCard
                      fromAccount={
                        fromAccount
                      }
                      toAccount={
                        toAccount
                      }
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
                      Please make sure the receiver
                      account details are correct.
                      Transfers may not be reversible
                      after processing.
                    </Alert>
                  </Stack>
                )}

                <Divider sx={{ my: 4 }} />

                <Stack
                  direction={{
                    xs: "column-reverse",
                    sm: "row",
                  }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={
                      resetTransfer
                    }
                    disabled={processing}
                    sx={{
                      borderRadius: 2,
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
                        onClick={
                          handleBack
                        }
                        disabled={
                          processing
                        }
                        sx={{
                          borderRadius: 2,
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
                        processing
                      }
                      sx={{
                        borderRadius: 2,
                        textTransform:
                          "none",
                        fontWeight: 800,
                        minWidth: 140,
                      }}
                    >
                      {activeStep === 0
                        ? "Continue"
                        : activeStep === 1
                        ? "Review"
                        : "Confirm"}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* SIDEBAR */}

            <Stack spacing={3}>
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

      {/* CONFIRM DIALOG */}

      <Dialog
        open={confirmOpen}
        onClose={() =>
          !processing &&
          setConfirmOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Confirm Transfer
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <Alert
              severity="info"
              icon={<VerifiedUser />}
              sx={{
                borderRadius: 2.5,
              }}
            >
              You are about to transfer funds to a
              verified receiver account.
            </Alert>

            <ReviewCard
              fromAccount={
                fromAccount
              }
              toAccount={toAccount}
              amount={transferAmount}
              fee={fee}
              total={total}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 1,
          }}
        >
          <Button
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
            onClick={
              handleTransfer
            }
            disabled={processing}
            startIcon={
              processing ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <Lock />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              minWidth: 150,
            }}
          >
            {processing
              ? "Processing..."
              : "Confirm Transfer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
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
            width: "100%",
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
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>

      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          value={
            account
              ? `${getAccountNumber(
                  account
                )} — ${getCustomerName(
                  account
                )}`
              : search
          }
          onChange={(event) => {
            if (account) {
              onSelect(null);
              setSearch("");
            } else {
              setSearch(
                event.target.value
              );
            }
          }}
          onFocus={() =>
            setOpen(true)
          }
          placeholder="Search your account"
          error={Boolean(error)}
          helperText={error}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountBalanceWallet />
              </InputAdornment>
            ),
            endAdornment: account ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    onSelect(null);
                    setSearch("");
                  }}
                  size="small"
                >
                  <Close />
                </IconButton>
              </InputAdornment>
            ) : (
              <InputAdornment position="end">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 58,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
            },
          }}
        />

        <Collapse in={open && !account}>
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              zIndex: 20,
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: 280,
              overflow: "auto",
              borderRadius: 2.5,
              border:
                "1px solid #e2e8f0",
            }}
          >
            {accounts.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography
                  color="text.secondary"
                  align="center"
                >
                  No accounts found.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {accounts.map((item) => (
                  <ListItem
                    key={item.id}
                    disablePadding
                  >
                    <ListItemButton
                      onClick={() =>
                        onSelect(item)
                      }
                    >
                      <Avatar
                        sx={{
                          mr: 1.5,
                          bgcolor:
                            "#e0f2fe",
                          color:
                            "#0369a1",
                        }}
                      >
                        <AccountBalance />
                      </Avatar>

                      <ListItemText
                        primary={
                          <Typography fontWeight={800}>
                            {getAccountNumber(
                              item
                            )}
                          </Typography>
                        }
                        secondary={
                          <>
                            {getCustomerName(
                              item
                            )}{" "}
                            •{" "}
                            {getAccountType(
                              item
                            )}
                          </>
                        }
                      />

                      <ChevronRight color="action" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );
}

/* =========================================================
   RECEIVER SELECTOR
========================================================= */

function ReceiverSelector({
  account,
  accountNumber,
  setAccountNumber,
  onVerify,
  loading,
  error,
  onClear,
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
            To Account
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Destination account
          </Typography>
        </Box>

        {account && (
          <Chip
            size="small"
            label="Verified"
            color="success"
            icon={<CheckCircle />}
            variant="outlined"
          />
        )}
      </Stack>

      {account ? (
        <Paper
          elevation={0}
          sx={{
            border:
              "1px solid #86efac",
            borderRadius: 2.5,
            p: 2,
            bgcolor: "#f0fdf4",
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
                bgcolor: "#dcfce7",
                color: "#15803d",
              }}
            >
              <CheckCircle />
            </Avatar>

            <Box flex={1}>
              <Typography fontWeight={900}>
                {getCustomerName(
                  account
                )}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Account:{" "}
                {getAccountNumber(
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

                <Chip
                  size="small"
                  label={
                    account.status ||
                    "ACTIVE"
                  }
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Tooltip title="Change receiver">
              <IconButton
                onClick={onClear}
              >
                <Close />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      ) : (
        <TextField
          fullWidth
          value={accountNumber}
          onChange={(event) =>
            setAccountNumber(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              /^\d{10}$/.test(
                accountNumber
              )
            ) {
              event.preventDefault();
              onVerify();
            }
          }}
          inputProps={{
            inputMode: "numeric",
            pattern: "[0-9]*",
            maxLength: 10,
          }}
          placeholder="Enter 10-digit account number"
          error={Boolean(error)}
          helperText={
            error ||
            "Enter the receiver's 10-digit account number and click Verify."
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),

            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  onClick={onVerify}
                  disabled={
                    loading ||
                    !/^\d{10}$/.test(
                      accountNumber
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform:
                      "none",
                    fontWeight: 800,
                    minWidth: 95,
                  }}
                >
                  {loading ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                    />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 58,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
            },
          }}
        />
      )}
    </Box>
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
        border:
          "1px solid #e2e8f0",
        borderRadius: 2.5,
        p: 2,
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

        <ArrowForward color="action" />

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
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="center"
      flex={1}
      width="100%"
    >
      <Avatar
        sx={{
          bgcolor:
            label === "From"
              ? "#dbeafe"
              : "#dcfce7",
          color:
            label === "From"
              ? "#2563eb"
              : "#15803d",
        }}
      >
        {label === "From" ? (
          <ArrowBack />
        ) : (
          <ArrowForward />
        )}
      </Avatar>

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {label}
        </Typography>

        <Typography fontWeight={900}>
          {getAccountNumber(
            account
          )}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          {getCustomerName(
            account
          )}
        </Typography>
      </Box>
    </Stack>
  );
}

/* =========================================================
   BALANCE CARD
========================================================= */

function BalanceCard({
  account,
  amount,
  remaining,
}) {
  if (!account) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border:
          "1px solid #e2e8f0",
        bgcolor: "#f8fafc",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Available Balance
          </Typography>

          <Typography fontWeight={900}>
            {formatCurrency(
              getBalance(account)
            )}
          </Typography>
        </Stack>

        <Divider />

        <Stack
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            After Transfer
          </Typography>

          <Typography
            fontWeight={900}
            color={
              remaining < 0
                ? "error.main"
                : "success.main"
            }
          >
            {formatCurrency(
              remaining
            )}
          </Typography>
        </Stack>

        {amount > 0 &&
          remaining >= 0 && (
            <Alert
              severity="success"
              icon={<CheckCircle />}
              sx={{
                borderRadius: 2,
              }}
            >
              Sufficient balance available.
            </Alert>
          )}
      </Stack>
    </Paper>
  );
}

/* =========================================================
   QUICK AMOUNTS
========================================================= */

function QuickAmounts({
  onSelect,
}) {
  const amounts = [
    500,
    1000,
    2000,
    5000,
    10000,
  ];

  return (
    <Box>
      <Typography
        variant="body2"
        fontWeight={800}
        sx={{ mb: 1 }}
      >
        Quick Amounts
      </Typography>

      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
      >
        {amounts.map((value) => (
          <Button
            key={value}
            variant="outlined"
            onClick={() =>
              onSelect(value)
            }
            sx={{
              borderRadius: 2,
              textTransform:
                "none",
              fontWeight: 800,
            }}
          >
            {formatCurrency(value)}
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
        border:
          "1px solid #e2e8f0",
        borderRadius: 2.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2.5,
          bgcolor: "#f8fafc",
        }}
      >
        <Typography fontWeight={900}>
          Transfer Details
        </Typography>
      </Box>

      <Stack spacing={0}>
        <SummaryLine
          label="From Account"
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

        <SummaryLine
          label="To Account"
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

        <Divider />

        <SummaryLine
          label="Transfer Amount"
          value={formatCurrency(
            amount
          )}
        />

        <SummaryLine
          label="Transfer Fee"
          value={formatCurrency(
            fee
          )}
        />

        <SummaryLine
          label="Total"
          value={formatCurrency(
            total
          )}
          strong
        />
      </Stack>
    </Paper>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={2}
      sx={{ p: 2 }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        fontWeight={
          strong ? 800 : 500
        }
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={
          strong ? 900 : 700
        }
        textAlign="right"
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   TRANSFER SUMMARY
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
        border:
          "1px solid #e2e8f0",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          fontWeight={900}
          sx={{ mb: 2 }}
        >
          Transfer Summary
        </Typography>

        <Stack spacing={1.5}>
          <MiniAccount
            label="From"
            account={fromAccount}
          />

          <MiniAccount
            label="To"
            account={toAccount}
          />

          <Divider />

          <SummaryLine
            label="Amount"
            value={formatCurrency(
              amount
            )}
          />

          <SummaryLine
            label="Fee"
            value={formatCurrency(
              fee
            )}
          />

          <SummaryLine
            label="Total"
            value={formatCurrency(
              total
            )}
            strong
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   MINI ACCOUNT
========================================================= */

function MiniAccount({
  label,
  account,
}) {
  return (
    <Box>
      <Typography
        variant="caption"
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

      <Typography
        variant="caption"
        color="text.secondary"
      >
        {getCustomerName(
          account
        )}
      </Typography>
    </Box>
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
        border:
          "1px solid #bbf7d0",
        borderRadius: 3,
        bgcolor: "#f0fdf4",
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
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
              <Typography fontWeight={900}>
                Secure Transfer
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Protected by banking security
              </Typography>
            </Box>
          </Stack>

          <SecurityRow
            icon={<VerifiedUser />}
            text="Receiver verification"
          />

          <SecurityRow
            icon={<Lock />}
            text="JWT authenticated"
          />

          <SecurityRow
            icon={<CheckCircle />}
            text="Server-side authorization"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function SecurityRow({
  icon,
  text,
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
    >
      <Box
        sx={{
          display: "flex",
          color: "#15803d",
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="body2"
        fontWeight={700}
      >
        {text}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   RECENT INFO CARD
========================================================= */

function RecentInfoCard({
  accounts,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border:
          "1px solid #e2e8f0",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <History />

          <Typography fontWeight={900}>
            Available Accounts
          </Typography>
        </Stack>

        {accounts.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            No accounts available.
          </Typography>
        ) : (
          <Stack spacing={1.2}>
            {accounts
              .slice(0, 5)
              .map((account) => (
                <Paper
                  key={account.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor:
                      "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                  >
                    {getAccountNumber(
                      account
                    )}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {getCustomerName(
                      account
                    )}
                  </Typography>
                </Paper>
              ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   SUCCESS TRANSFER
========================================================= */

function SuccessTransfer({
  result,
  fromAccount,
  toAccount,
  amount,
  onReset,
}) {
  const transactionId =
    result?.transactionId ||
    result?.id ||
    result?.transaction?.id;

  return (
    <Card
      elevation={0}
      sx={{
        maxWidth: 800,
        mx: "auto",
        border:
          "1px solid #bbf7d0",
        borderRadius: 4,
        bgcolor: "#ffffff",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 3,
            md: 5,
          },
        }}
      >
        <Stack
          spacing={3}
          alignItems="center"
          textAlign="center"
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "#dcfce7",
              color: "#15803d",
            }}
          >
            <CheckCircle
              sx={{ fontSize: 50 }}
            />
          </Avatar>

          <Box>
            <Typography
              variant="h5"
              fontWeight={900}
              color="#15803d"
            >
              Transfer Successful
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Your money has been transferred
              successfully.
            </Typography>
          </Box>

          <Typography
            variant="h4"
            fontWeight={900}
            color="#0f172a"
          >
            {formatCurrency(amount)}
          </Typography>

          <Paper
            elevation={0}
            sx={{
              width: "100%",
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <Stack spacing={1.5}>
              <SummaryLine
                label="From"
                value={`${getCustomerName(
                  fromAccount
                )} • ${getAccountNumber(
                  fromAccount
                )}`}
              />

              <SummaryLine
                label="To"
                value={`${getCustomerName(
                  toAccount
                )} • ${getAccountNumber(
                  toAccount
                )}`}
              />

              {transactionId && (
                <SummaryLine
                  label="Transaction ID"
                  value={String(
                    transactionId
                  )}
                />
              )}

              <SummaryLine
                label="Date"
                value={formatDate(
                  result?.createdAt ||
                    result?.timestamp ||
                    new Date()
                )}
              />
            </Stack>
          </Paper>

          {transactionId && (
            <Button
              variant="outlined"
              startIcon={
                <ContentCopy />
              }
              onClick={() => {
                navigator.clipboard?.writeText(
                  String(transactionId)
                );
              }}
              sx={{
                borderRadius: 2,
                textTransform:
                  "none",
                fontWeight: 800,
              }}
            >
              Copy Transaction ID
            </Button>
          )}

          <Button
            variant="contained"
            onClick={onReset}
            startIcon={<Refresh />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              minWidth: 180,
            }}
          >
            Make Another Transfer
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default Transfer;