import { useEffect, useMemo, useState } from "react";

import {
  AccountBalance,
  AccountBalanceWallet,
  Add,
  ArrowUpward,
  CheckCircle,
  Close,
  ContentCopy,
  Delete,
  Edit,
  Error,
  People,
  Refresh,
  Search,
  TrendingUp,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
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

const getCustomerId = (account) => {
  return account?.customer?.id ?? account?.customerId ?? null;
};

const getCustomerName = (account) => {
  return (
    account?.customer?.name ||
    account?.customer?.fullName ||
    account?.customerName ||
    "N/A"
  );
};

const getCustomerEmail = (account) => {
  return account?.customer?.email || account?.customerEmail || "N/A";
};

const getAccountType = (account) => {
  return account?.accountType || account?.type || "N/A";
};

/* =========================================================
   CUSTOMER NAME HELPER
========================================================= */

const getCustomerNameFromCustomer = (customer) => {
  if (!customer) {
    return "";
  }

  if (customer.name) {
    return String(customer.name);
  }

  if (customer.fullName) {
    return String(customer.fullName);
  }

  const firstName = customer.firstName || "";
  const lastName = customer.lastName || "";

  return `${firstName} ${lastName}`.trim();
};

/* =========================================================
   CURRENT USER ROLE
========================================================= */

const getCurrentUserRole = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return "USER";
    }

    const user = JSON.parse(storedUser);

    return String(user?.role || "")
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, "");
  } catch (error) {
    console.error("Failed to read current user role:", error);

    return "USER";
  }
};

/* =========================================================
   ACCOUNTS
========================================================= */

function Accounts() {
  const [accounts, setAccounts] = useState([]);

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
  const [balance, setBalance] = useState("");

  // NEW
  const [accountHolderName, setAccountHolderName] = useState("");

  // Internal customer ID used by backend
  const [customerId, setCustomerId] = useState("");

  /* =======================================================
     CUSTOMERS
  ======================================================= */

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  /* =======================================================
     GENERAL STATE
  ======================================================= */

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [accountToDelete, setAccountToDelete] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const isAdmin = getCurrentUserRole() === "ADMIN";

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    loadAccounts();
    loadCustomers();
  }, []);

  /* =======================================================
     LOAD ACCOUNTS
  ======================================================= */

  const loadAccounts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/accounts");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load accounts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

  const loadCustomers = async () => {
    setCustomersLoading(true);

    try {
      const response = await api.get("/customers");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);

      showToast(
        "error",
        "Unable to load customers. Account holder selection may not work."
      );
    } finally {
      setCustomersLoading(false);
    }
  };

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
     RESET FORM
  ======================================================= */

  const resetForm = () => {
    setAccountNumber("");
    setAccountType("SAVINGS");
    setBalance("");
    setAccountHolderName("");
    setCustomerId("");
    setEditingId(null);
  };

  /* =======================================================
     FIND CUSTOMER BY NAME
  ======================================================= */

  const findCustomerByName = (name) => {
    const normalizedName = String(name || "")
      .trim()
      .toLowerCase();

    if (!normalizedName) {
      return null;
    }

    return (
      customers.find((customer) => {
        const customerName =
          getCustomerNameFromCustomer(customer)
            .trim()
            .toLowerCase();

        return customerName === normalizedName;
      }) || null
    );
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    if (!isAdmin) {
      setError(
        "You do not have permission to manage accounts."
      );

      return false;
    }

    if (!accountType) {
      setError("Account type is required.");
      return false;
    }

    if (
      !accountNumber.trim() ||
      accountNumber.trim().length < 3
    ) {
      setError(
        "Account number must be at least 3 characters."
      );

      return false;
    }

    const parsedBalance = Number(balance);

    if (
      Number.isNaN(parsedBalance) ||
      parsedBalance < 0
    ) {
      setError(
        "Balance must be a non-negative number."
      );

      return false;
    }

    if (!accountHolderName.trim()) {
      setError("Account holder name is required.");
      return false;
    }

    const matchedCustomer =
      findCustomerByName(accountHolderName);

    if (!matchedCustomer) {
      setError(
        `No customer found with the name "${accountHolderName}". Please enter the exact customer name.`
      );

      return false;
    }

    setCustomerId(String(matchedCustomer.id));

    return true;
  };

  /* =======================================================
     CREATE ACCOUNT
  ======================================================= */

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "You do not have permission to create accounts."
      );

      return;
    }

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    const matchedCustomer =
      findCustomerByName(accountHolderName);

    if (!matchedCustomer) {
      setError(
        "Customer not found. Please enter a valid account holder name."
      );

      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        accountNumber: accountNumber.trim(),
        accountType: accountType,
        balance: Number(balance),
        customerId: Number(matchedCustomer.id),
      };

      console.log(
        "Creating account with payload:",
        payload
      );

      const response = await api.post(
        "/accounts",
        payload
      );

      setAccounts((previous) => [
        ...previous,
        response.data,
      ]);

      resetForm();

      setMessage(
        "Account created successfully."
      );

      showToast(
        "success",
        "Account created successfully."
      );
    } catch (err) {
      console.error(
        "Failed to create account:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create account.";

      setError(errorMessage);

      showToast("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     EDIT ACCOUNT
  ======================================================= */

  const handleEdit = (account) => {
    if (!isAdmin) {
      showToast(
        "error",
        "You do not have permission to edit accounts."
      );

      return;
    }

    setEditingId(account.id);

    setAccountNumber(
      account.accountNumber || ""
    );

    setAccountType(
      account.accountType ||
        account.type ||
        "SAVINGS"
    );

    setBalance(
      String(account.balance ?? "")
    );

    const existingCustomerId =
      getCustomerId(account);

    setCustomerId(
      String(existingCustomerId ?? "")
    );

    setAccountHolderName(
      getCustomerName(account) === "N/A"
        ? ""
        : getCustomerName(account)
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     UPDATE ACCOUNT
  ======================================================= */

  const handleUpdateAccount = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "You do not have permission to update accounts."
      );

      return;
    }

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    const matchedCustomer =
      findCustomerByName(accountHolderName);

    if (!matchedCustomer) {
      setError(
        "Customer not found. Please enter a valid account holder name."
      );

      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        accountNumber: accountNumber.trim(),
        accountType: accountType,
        balance: Number(balance),
        customer: {
          id: Number(matchedCustomer.id),
        },
      };

      console.log(
        "Updating account with payload:",
        payload
      );

      const response = await api.put(
        `/accounts/${editingId}`,
        payload
      );

      setAccounts((previous) =>
        previous.map((account) =>
          account.id === editingId
            ? response.data
            : account
        )
      );

      resetForm();

      setMessage(
        "Account updated successfully."
      );

      showToast(
        "success",
        "Account updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update account:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update account.";

      setError(errorMessage);

      showToast("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     CANCEL EDIT
  ======================================================= */

  const handleCancelEdit = () => {
    resetForm();
    setError("");
    setMessage("");
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const openDeleteDialog = (account) => {
    if (!isAdmin) {
      showToast(
        "error",
        "You do not have permission to delete accounts."
      );

      return;
    }

    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (submitting) {
      return;
    }

    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setError(
        "You do not have permission to delete accounts."
      );

      return;
    }

    if (!accountToDelete?.id) {
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    const previousAccounts = accounts;

    setAccounts((previous) =>
      previous.filter(
        (account) =>
          account.id !== accountToDelete.id
      )
    );

    try {
      await api.delete(
        `/accounts/${accountToDelete.id}`
      );

      setDeleteDialogOpen(false);
      setAccountToDelete(null);

      showToast(
        "success",
        "Account deleted successfully."
      );

      setMessage(
        "Account deleted successfully."
      );
    } catch (err) {
      console.error(
        "Failed to delete account:",
        err
      );

      setAccounts(previousAccounts);

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete account.";

      setError(errorMessage);

      showToast("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredAccounts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return accounts;
    }

    return accounts.filter((account) => {
      const accountNumber = String(
        account.accountNumber || ""
      ).toLowerCase();

      const customerName = String(
        getCustomerName(account)
      ).toLowerCase();

      const customerEmail = String(
        getCustomerEmail(account)
      ).toLowerCase();

      const customer = String(
        getCustomerId(account) || ""
      ).toLowerCase();

      const type = String(
        getAccountType(account)
      ).toLowerCase();

      return (
        accountNumber.includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        customer.includes(query) ||
        type.includes(query)
      );
    });
  }, [accounts, search]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalBalance = useMemo(() => {
    return accounts.reduce(
      (total, account) =>
        total + Number(account.balance || 0),
      0
    );
  }, [accounts]);

  const averageBalance =
    accounts.length > 0
      ? totalBalance / accounts.length
      : 0;

  /* =======================================================
     VIEW DETAILS
  ======================================================= */

  const handleViewDetails = (account) => {
    setSelectedAccount(account);
    setDetailsOpen(true);
  };

  /* =======================================================
     COPY ACCOUNT NUMBER
  ======================================================= */

  const copyAccountNumber = async (number) => {
    if (!number) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        String(number)
      );

      showToast(
        "success",
        "Account number copied."
      );
    } catch {
      showToast(
        "error",
        "Unable to copy account number."
      );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f4f6f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 3,
            border: "1px solid #e4e7ec",
          }}
        >
          <CardContent
            sx={{
              p: 4,
              textAlign: "center",
            }}
          >
            <CircularProgress
              size={38}
              thickness={4}
            />

            <Typography
              sx={{
                mt: 2,
                fontWeight: 800,
                color: "#101828",
              }}
            >
              Loading accounts
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "#667085",
              }}
            >
              Fetching account information...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
          spacing={2}
          sx={{
            mb: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              flex: 1,
            }}
          >
            <Avatar
              sx={{
                width: 54,
                height: 54,
                borderRadius: 2.5,
                bgcolor: "#eff8ff",
                color: "#1570ef",
                border:
                  "1px solid #b2ddff",
              }}
            >
              <AccountBalance />
            </Avatar>

            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: "1.7rem",
                    sm: "2rem",
                    md: "2.25rem",
                  },
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#101828",
                }}
              >
                Accounts
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: "#667085",
                  fontSize: ".9rem",
                }}
              >
                Manage bank accounts, balances and
                customer relationships
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                loadAccounts();
                loadCustomers();
              }}
              disabled={
                loading ||
                submitting ||
                customersLoading
              }
              sx={{
                height: 42,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 750,
                borderColor: "#d0d5dd",
                color: "#344054",
              }}
            >
              Refresh
            </Button>

            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  resetForm();

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                sx={{
                  height: 42,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#1570ef",
                  boxShadow:
                    "0 4px 12px rgba(21,112,239,.2)",

                  "&:hover": {
                    bgcolor: "#175cd3",
                  },
                }}
              >
                New Account
              </Button>
            )}
          </Stack>
        </Stack>

        {/* =================================================
            GLOBAL ERROR
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            icon={<Error />}
            onClose={() => setError("")}
            sx={{
              mb: 2.5,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {message && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            onClose={() => setMessage("")}
            sx={{
              mb: 2.5,
              borderRadius: 2,
            }}
          >
            {message}
          </Alert>
        )}

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard
            icon={<AccountBalanceWallet />}
            title="Total Accounts"
            value={accounts.length}
            subtitle="Active accounts in system"
            iconBg="#eff8ff"
            iconColor="#1570ef"
          />

          <StatCard
            icon={<TrendingUp />}
            title="Total Balance"
            value={formatCurrency(totalBalance)}
            subtitle="Combined account balance"
            iconBg="#ecfdf3"
            iconColor="#039855"
          />

          <StatCard
            icon={<People />}
            title="Average Balance"
            value={formatCurrency(averageBalance)}
            subtitle="Average per account"
            iconBg="#f9f5ff"
            iconColor="#7f56d9"
          />
        </Box>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.65fr) minmax(320px, .7fr)",
            },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* =================================================
              LEFT
          ================================================= */}

          <Stack spacing={3}>

            {/* =================================================
                CREATE / EDIT FORM
            ================================================= */}

            {isAdmin && (
              <Card
                sx={{
                  borderRadius: 3,
                  border:
                    "1px solid #e4e7ec",
                  boxShadow:
                    "0 8px 25px rgba(16,24,40,.05)",
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2,
                      sm: 3,
                      md: 3.5,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: editingId
                          ? "#fff7ed"
                          : "#eff8ff",
                        color: editingId
                          ? "#c2410c"
                          : "#1570ef",
                      }}
                    >
                      {editingId ? (
                        <Edit />
                      ) : (
                        <Add />
                      )}
                    </Avatar>

                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 850,
                          fontSize: "1.1rem",
                          color: "#101828",
                        }}
                      >
                        {editingId
                          ? "Edit Account"
                          : "Create New Account"}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.3,
                          color: "#667085",
                        }}
                      >
                        {editingId
                          ? "Update the account information below."
                          : "Enter the account and account holder information."}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  <form
                    onSubmit={
                      editingId
                        ? handleUpdateAccount
                        : handleCreateAccount
                    }
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(2, 1fr)",
                        },
                        gap: 2,
                      }}
                    >
                      {/* ACCOUNT TYPE */}

                      <TextField
                        select
                        fullWidth
                        label="Account Type"
                        value={accountType}
                        onChange={(event) =>
                          setAccountType(
                            event.target.value
                          )
                        }
                        disabled={submitting}
                        required
                        SelectProps={{
                          native: true,
                        }}
                        sx={inputStyles}
                      >
                        <option value="SAVINGS">
                          Savings Account
                        </option>

                        <option value="CURRENT">
                          Current Account
                        </option>
                      </TextField>

                      {/* ACCOUNT NUMBER */}

                      <TextField
                        fullWidth
                        label="Account Number"
                        placeholder="Example: ACC10005"
                        value={accountNumber}
                        onChange={(event) =>
                          setAccountNumber(
                            event.target.value
                          )
                        }
                        disabled={submitting}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountBalance
                                sx={{
                                  color:
                                    "#98a2b3",
                                }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={inputStyles}
                      />

                      {/* =================================================
                          ACCOUNT HOLDER NAME
                      ================================================= */}

                      <TextField
                        fullWidth
                        label="Account Holder Name"
                        placeholder="Example: Tushar Khatik"
                        value={accountHolderName}
                        onChange={(event) => {
                          setAccountHolderName(
                            event.target.value
                          );

                          // Clear previous ID when
                          // user changes the name.
                          setCustomerId("");
                        }}
                        disabled={
                          submitting ||
                          customersLoading
                        }
                        required
                        helperText={
                          customersLoading
                            ? "Loading customers..."
                            : "Enter the exact registered customer name"
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <People
                                sx={{
                                  color:
                                    "#98a2b3",
                                }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={inputStyles}
                      />

                      {/* OPENING BALANCE */}

                      <TextField
                        fullWidth
                        label="Opening Balance"
                        type="number"
                        inputProps={{
                          min: 0,
                          step: "0.01",
                        }}
                        placeholder="0.00"
                        value={balance}
                        onChange={(event) =>
                          setBalance(
                            event.target.value
                          )
                        }
                        disabled={submitting}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography
                                sx={{
                                  fontWeight: 900,
                                  color:
                                    "#344054",
                                }}
                              >
                                ₹
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          ...inputStyles,

                          "& .MuiInputBase-input":
                            {
                              fontWeight: 750,
                            },
                        }}
                      />
                    </Box>

                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1.5}
                      sx={{
                        mt: 3,
                      }}
                    >
                      {editingId && (
                        <Button
                          type="button"
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={
                            handleCancelEdit
                          }
                          disabled={submitting}
                          sx={{
                            minHeight: 48,
                            borderRadius: 2,
                            textTransform:
                              "none",
                            fontWeight: 750,
                            borderColor:
                              "#d0d5dd",
                            color: "#344054",
                          }}
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          submitting ? (
                            <CircularProgress
                              size={18}
                              color="inherit"
                            />
                          ) : editingId ? (
                            <Edit />
                          ) : (
                            <Add />
                          )
                        }
                        disabled={
                          submitting ||
                          customersLoading
                        }
                        sx={{
                          minHeight: 48,
                          flex: 1,
                          borderRadius: 2,
                          textTransform:
                            "none",
                          fontWeight: 800,
                          bgcolor: "#1570ef",

                          "&:hover": {
                            bgcolor: "#175cd3",
                          },
                        }}
                      >
                        {submitting
                          ? editingId
                            ? "Updating..."
                            : "Creating..."
                          : editingId
                          ? "Update Account"
                          : "Create Account"}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* =================================================
                ACCOUNT LIST
            ================================================= */}

            <Card
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e4e7ec",
                boxShadow:
                  "0 8px 25px rgba(16,24,40,.05)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: {
                    xs: 2,
                    sm: 2.5,
                  },
                  borderBottom:
                    "1px solid #eaecf0",
                  bgcolor: "#fff",
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2}
                  sx={{
                    alignItems: {
                      xs: "stretch",
                      sm: "center",
                    },
                    justifyContent:
                      "space-between",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 850,
                        fontSize: "1.05rem",
                        color: "#101828",
                      }}
                    >
                      All Accounts
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.25,
                        color: "#667085",
                      }}
                    >
                      {filteredAccounts.length}{" "}
                      account
                      {filteredAccounts.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      displayed
                    </Typography>
                  </Box>

                  <TextField
                    size="small"
                    placeholder="Search accounts..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    sx={{
                      width: {
                        xs: "100%",
                        sm: 270,
                      },

                      "& .MuiOutlinedInput-root":
                        {
                          borderRadius: 2,
                        },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search
                            sx={{
                              fontSize: 20,
                              color:
                                "#98a2b3",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Box>

              {filteredAccounts.length === 0 ? (
                <Box
                  sx={{
                    p: 6,
                    textAlign: "center",
                  }}
                >
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      mx: "auto",
                      bgcolor: "#f2f4f7",
                      color: "#98a2b3",
                    }}
                  >
                    <AccountBalanceWallet />
                  </Avatar>

                  <Typography
                    sx={{
                      mt: 2,
                      fontWeight: 800,
                      color: "#344054",
                    }}
                  >
                    No accounts found
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: "#667085",
                    }}
                  >
                    {search
                      ? "Try a different search term."
                      : isAdmin
                      ? "Create your first bank account to get started."
                      : "No bank accounts are available."}
                  </Typography>
                </Box>
              ) : (
                <Stack
                  divider={
                    <Divider flexItem />
                  }
                >
                  {filteredAccounts.map(
                    (account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        onEdit={handleEdit}
                        onDelete={
                          openDeleteDialog
                        }
                        onView={
                          handleViewDetails
                        }
                        onCopy={
                          copyAccountNumber
                        }
                        disabled={submitting}
                        isAdmin={isAdmin}
                      />
                    )
                  )}
                </Stack>
              )}
            </Card>
          </Stack>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <Stack spacing={2.5}>
            <Card
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e4e7ec",
                boxShadow:
                  "0 8px 25px rgba(16,24,40,.05)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  spacing={1.3}
                  sx={{
                    alignItems: "center",
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
                    <AccountBalanceWallet />
                  </Avatar>

                  <Box>
                    <Typography
                      fontWeight={850}
                      color="#101828"
                    >
                      Account Overview
                    </Typography>

                    <Typography
                      variant="caption"
                      color="#667085"
                    >
                      Current portfolio
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <SidebarMetric
                    label="Total accounts"
                    value={accounts.length}
                  />

                  <SidebarMetric
                    label="Total balance"
                    value={formatCurrency(
                      totalBalance
                    )}
                  />

                  <SidebarMetric
                    label="Average balance"
                    value={formatCurrency(
                      averageBalance
                    )}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                bgcolor: "#eff8ff",
                border:
                  "1px solid #b2ddff",
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  spacing={1.3}
                  sx={{
                    alignItems:
                      "flex-start",
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#d1e9ff",
                      color: "#1570ef",
                    }}
                  >
                    <AccountBalance />
                  </Avatar>

                  <Box>
                    <Typography
                      fontWeight={850}
                      color="#175cd3"
                    >
                      Account Management
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.6,
                        color: "#1849a9",
                        lineHeight: 1.6,
                      }}
                    >
                      {isAdmin
                        ? "Create, update and manage customer bank accounts from one place."
                        : "View your available bank accounts and account information."}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>

      {/* =====================================================
          DELETE DIALOG
      ===================================================== */}

      <Dialog
        open={deleteDialogOpen && isAdmin}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ p: 3 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#fef3f2",
                color: "#d92d20",
              }}
            >
              <Delete />
            </Avatar>

            <Box>
              <Typography fontWeight={900}>
                Delete Account
              </Typography>

              <Typography
                variant="caption"
                color="#667085"
              >
                This action cannot be undone
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3 }}>
          <Typography
            variant="body2"
            color="#475467"
            lineHeight={1.7}
          >
            Are you sure you want to delete
            account{" "}
            <strong>
              {accountToDelete?.accountNumber}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
          }}
        >
          <Button
            onClick={closeDeleteDialog}
            disabled={submitting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 750,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={
              submitting ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
              ) : (
                <Delete />
              )
            }
            onClick={handleDelete}
            disabled={submitting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            {submitting
              ? "Deleting..."
              : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          DETAILS DIALOG
      ===================================================== */}

      <Dialog
        open={detailsOpen}
        onClose={() =>
          setDetailsOpen(false)
        }
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
            borderBottom:
              "1px solid #eaecf0",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#eff8ff",
                color: "#1570ef",
              }}
            >
              <AccountBalanceWallet />
            </Avatar>

            <Box>
              <Typography fontWeight={900}>
                Account Details
              </Typography>

              <Typography
                variant="caption"
                color="#667085"
              >
                Account information
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedAccount && (
            <Stack spacing={0}>
              <DetailRow
                label="Account Number"
                value={
                  selectedAccount.accountNumber
                }
              />

              <DetailRow
                label="Account Type"
                value={getAccountType(
                  selectedAccount
                )}
              />

              <DetailRow
                label="Account ID"
                value={selectedAccount.id}
              />

              <DetailRow
                label="Balance"
                value={formatCurrency(
                  selectedAccount.balance
                )}
                highlight
              />

              <DetailRow
                label="Account Holder Name"
                value={getCustomerName(
                  selectedAccount
                )}
              />

              <DetailRow
                label="Customer ID"
                value={
                  getCustomerId(
                    selectedAccount
                  ) || "N/A"
                }
              />

              <DetailRow
                label="Customer Email"
                value={getCustomerEmail(
                  selectedAccount
                )}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() =>
              setDetailsOpen(false)
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 750,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          TOAST
      ===================================================== */}

      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
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
              <Error />
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
              sm: 360,
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
   ACCOUNT ROW
========================================================= */

function AccountRow({
  account,
  onEdit,
  onDelete,
  onView,
  onCopy,
  disabled,
  isAdmin,
}) {
  const balance = Number(
    account.balance || 0
  );

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 2.5,
        },
        transition:
          "background-color .15s ease",

        "&:hover": {
          bgcolor: "#f9fafb",
        },
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
        sx={{
          alignItems: {
            xs: "stretch",
            md: "center",
          },
        }}
      >
        {/* ACCOUNT */}

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              bgcolor: "#eff8ff",
              color: "#1570ef",
              flexShrink: 0,
            }}
          >
            <AccountBalanceWallet />
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: "center",
              }}
            >
              <Typography
                fontWeight={850}
                color="#101828"
                noWrap
              >
                {account.accountNumber ||
                  "Unnamed Account"}
              </Typography>

              <Tooltip title="Copy account number">
                <IconButton
                  size="small"
                  onClick={() =>
                    onCopy(
                      account.accountNumber
                    )
                  }
                >
                  <ContentCopy
                    sx={{
                      fontSize: 15,
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography
              variant="caption"
              color="#667085"
              noWrap
            >
              Account ID #{account.id}
            </Typography>
          </Box>
        </Stack>

        {/* ACCOUNT TYPE */}

        <Box
          sx={{
            minWidth: {
              md: 140,
            },
          }}
        >
          <Typography
            variant="caption"
            color="#667085"
          >
            ACCOUNT TYPE
          </Typography>

          <Typography
            sx={{
              mt: 0.2,
              fontWeight: 800,
              color: "#344054",
            }}
          >
            {getAccountType(account)}
          </Typography>
        </Box>

        {/* BALANCE */}

        <Box
          sx={{
            minWidth: {
              md: 170,
            },
          }}
        >
          <Typography
            variant="caption"
            color="#667085"
          >
            BALANCE
          </Typography>

          <Typography
            sx={{
              mt: 0.2,
              fontWeight: 900,
              fontSize: "1.05rem",
              color:
                balance > 0
                  ? "#027a48"
                  : "#667085",
            }}
          >
            {formatCurrency(balance)}
          </Typography>
        </Box>

        {/* CUSTOMER / ACCOUNT HOLDER */}

        <Box
          sx={{
            minWidth: {
              md: 190,
            },
          }}
        >
          <Typography
            variant="caption"
            color="#667085"
          >
            ACCOUNT HOLDER
          </Typography>

          <Typography
            sx={{
              mt: 0.2,
              fontWeight: 750,
              color: "#344054",
            }}
            noWrap
          >
            {getCustomerName(account)}
          </Typography>

          <Typography
            variant="caption"
            color="#98a2b3"
            noWrap
          >
            ID:{" "}
            {getCustomerId(account) ||
              "N/A"}
          </Typography>
        </Box>

        {/* STATUS */}

        <Chip
          size="small"
          label={
            account.status
              ? String(
                  account.status
                ).toUpperCase()
              : "ACTIVE"
          }
          icon={<CheckCircle />}
          sx={{
            alignSelf: {
              xs: "flex-start",
              md: "center",
            },
            height: 28,
            fontWeight: 800,
            bgcolor: "#ecfdf3",
            color: "#027a48",
            border:
              "1px solid #abefc6",

            "& .MuiChip-icon": {
              color: "#12b76a",
              fontSize: 16,
            },
          }}
        />

        {/* ACTIONS */}

        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
          }}
        >
          <Tooltip title="View details">
            <IconButton
              onClick={() =>
                onView(account)
              }
              disabled={disabled}
              sx={{
                color: "#475467",
              }}
            >
              <ArrowUpward
                sx={{
                  transform:
                    "rotate(45deg)",
                }}
              />
            </IconButton>
          </Tooltip>

          {isAdmin && (
            <Tooltip title="Edit">
              <IconButton
                onClick={() =>
                  onEdit(account)
                }
                disabled={disabled}
                sx={{
                  color: "#1570ef",
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}

          {isAdmin && (
            <Tooltip title="Delete">
              <IconButton
                onClick={() =>
                  onDelete(account)
                }
                disabled={disabled}
                sx={{
                  color: "#d92d20",
                }}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  iconBg,
  iconColor,
}) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border:
          "1px solid #e4e7ec",
        boxShadow:
          "0 8px 25px rgba(16,24,40,.05)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
          }}
        >
          <Avatar
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              bgcolor: iconBg,
              color: iconColor,
            }}
          >
            {icon}
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              variant="caption"
              color="#667085"
              fontWeight={700}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                fontWeight: 900,
                fontSize: "1.2rem",
                color: "#101828",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="caption"
              color="#98a2b3"
            >
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   SIDEBAR METRIC
========================================================= */

function SidebarMetric({
  label,
  value,
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: 2,
      }}
    >
      <Typography
        variant="body2"
        color="#667085"
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={850}
        color="#344054"
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  highlight = false,
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent:
          "space-between",
        py: 1.4,
        borderBottom:
          "1px solid #f2f4f7",
      }}
    >
      <Typography
        variant="body2"
        color="#667085"
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={highlight ? 900 : 750}
        color={
          highlight
            ? "#027a48"
            : "#344054"
        }
        sx={{
          textAlign: "right",
          wordBreak: "break-word",
        }}
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
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#1570ef",
  },

  "& .MuiFormHelperText-root": {
    marginLeft: 0,
  },
};

export default Accounts;

