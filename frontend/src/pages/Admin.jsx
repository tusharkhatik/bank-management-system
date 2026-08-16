import { useEffect, useMemo, useState } from "react";

import {
  AccountBalance,
  AccountBalanceWallet,
  AdminPanelSettings,
  ArrowDownward,
  ArrowUpward,
  Assessment,
  Block,
  CheckCircle,
  ChevronRight,
  Close,
  Dashboard,
  Download,
  History,
  Lock,
  MoreHoriz,
  People,
  PersonAdd,
  Refresh,
  Search,
  Security,
  SwapHoriz,
  TrendingUp,
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
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
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
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* =========================================================
   UI DESIGN SYSTEM
========================================================= */

const adminUI = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    px: {
      xs: 1.5,
      sm: 2,
      md: 3,
      lg: 4,
    },
    py: {
      xs: 2,
      sm: 2.5,
      md: 3,
    },
  },

  surface: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow:
      "0 1px 2px rgba(15,23,42,.03), 0 8px 30px rgba(15,23,42,.04)",
  },

  iconBox: {
    width: 46,
    height: 46,
    flexShrink: 0,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    color: "#2563eb",
  },

  tableRow: {
    px: {
      xs: 1.5,
      sm: 2.5,
    },
    py: 1.75,
    borderBottom: "1px solid #eef2f7",
    transition:
      "background-color 160ms ease, box-shadow 160ms ease",
    "&:hover": {
      backgroundColor: "#f8fafc",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },

  tableHeader: {
    px: {
      xs: 1.5,
      sm: 2.5,
    },
    py: 1.2,
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },

  toolbar: {
    px: {
      xs: 1.5,
      sm: 2,
    },
    py: 1.5,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },

  input: {
    "& .MuiOutlinedInput-root": {
      minHeight: 42,
      borderRadius: "10px",
      backgroundColor: "#f8fafc",
      fontSize: "0.875rem",
      transition: "all 160ms ease",

      "& fieldset": {
        borderColor: "#e2e8f0",
      },

      "&:hover fieldset": {
        borderColor: "#cbd5e1",
      },

      "&.Mui-focused": {
        backgroundColor: "#ffffff",
      },

      "&.Mui-focused fieldset": {
        borderWidth: "1px",
        borderColor: "#2563eb",
        boxShadow:
          "0 0 0 3px rgba(37,99,235,.10)",
      },
    },
  },

  tab: {
    minHeight: 56,
    px: {
      xs: 1.5,
      sm: 2,
    },
    textTransform: "none",
    fontWeight: 700,
    fontSize: "0.875rem",
    color: "#64748b",

    "&.Mui-selected": {
      color: "#2563eb",
    },
  },
};

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        boxShadow:
          "0 1px 2px rgba(15,23,42,.03)",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "#cbd5e1",
          boxShadow:
            "0 12px 30px rgba(15,23,42,.08)",
        },
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            sm: 2.25,
          },
          "&:last-child": {
            pb: {
              xs: 2,
              sm: 2.25,
            },
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#64748b",
                fontSize: "0.72rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.045em",
              }}
            >
              {title}
            </Typography>

            {loading ? (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  sx={{
                    width: 100,
                    height: 6,
                    borderRadius: 10,
                  }}
                />
              </Box>
            ) : (
              <Typography
                sx={{
                  mt: 0.65,
                  fontSize: {
                    xs: "1.5rem",
                    sm: "1.7rem",
                  },
                  fontWeight: 850,
                  color: "#0f172a",
                  letterSpacing: "-0.045em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {value}
              </Typography>
            )}

            <Typography
              sx={{
                mt: 0.55,
                fontSize: "0.73rem",
                color: "#94a3b8",
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box sx={adminUI.iconBox}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   STATUS CHIP
========================================================= */

function StatusChip({ status }) {
  const normalized = String(
    status || "ACTIVE"
  ).toUpperCase();

  const config = {
    ACTIVE: {
      label: "Active",
      color: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      dot: "#22c55e",
    },

    COMPLETED: {
      label: "Completed",
      color: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      dot: "#22c55e",
    },

    BLOCKED: {
      label: "Blocked",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
      dot: "#ef4444",
    },

    FROZEN: {
      label: "Frozen",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
      dot: "#ef4444",
    },

    INACTIVE: {
      label: "Inactive",
      color: "#64748b",
      bg: "#f8fafc",
      border: "#e2e8f0",
      dot: "#94a3b8",
    },

    FAILED: {
      label: "Failed",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
      dot: "#ef4444",
    },

    PENDING: {
      label: "Pending",
      color: "#a16207",
      bg: "#fefce8",
      border: "#fde68a",
      dot: "#eab308",
    },

    PROCESSING: {
      label: "Processing",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      dot: "#3b82f6",
    },

    WARNING: {
      label: "Warning",
      color: "#a16207",
      bg: "#fefce8",
      border: "#fde68a",
      dot: "#eab308",
    },
  };

  const item =
    config[normalized] || config.ACTIVE;

  return (
    <Chip
      size="small"
      label={
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.7}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: item.dot,
            }}
          />

          <span>{item.label}</span>
        </Stack>
      }
      sx={{
        height: 26,
        borderRadius: "7px",
        backgroundColor: item.bg,
        border: `1px solid ${item.border}`,
        color: item.color,
        fontSize: "0.69rem",
        fontWeight: 800,

        "& .MuiChip-label": {
          px: 1,
        },
      }}
    />
  );
}

/* =========================================================
   TRANSACTION TYPE
========================================================= */

function TransactionType({ type }) {
  const normalized = String(
    type || ""
  ).toUpperCase();

  const config = {
    DEPOSIT: {
      label: "Deposit",
      color: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      icon: <ArrowDownward sx={{ fontSize: 13 }} />,
    },

    WITHDRAW: {
      label: "Withdrawal",
      color: "#c2410c",
      bg: "#fff7ed",
      border: "#fed7aa",
      icon: <ArrowUpward sx={{ fontSize: 13 }} />,
    },

    TRANSFER: {
      label: "Transfer",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: <SwapHoriz sx={{ fontSize: 13 }} />,
    },
  };

  const item =
    config[normalized] || {
      label: normalized || "Unknown",
      color: "#475569",
      bg: "#f8fafc",
      border: "#e2e8f0",
      icon: null,
    };

  return (
    <Chip
      size="small"
      icon={item.icon}
      label={item.label}
      sx={{
        height: 27,
        borderRadius: "7px",
        color: item.color,
        backgroundColor: item.bg,
        border: `1px solid ${item.border}`,
        fontWeight: 750,
        fontSize: "0.7rem",

        "& .MuiChip-icon": {
          color: item.color,
        },
      }}
    />
  );
}

/* =========================================================
   ADMIN
========================================================= */

function Admin() {
  const [activeTab, setActiveTab] = useState(0);

  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [transactionFilter, setTransactionFilter] =
    useState("ALL");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [selectedAccount, setSelectedAccount] =
    useState(null);

  /* =======================================================
     LOAD ADMIN DATA
  ======================================================= */

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        customersResponse,
        accountsResponse,
        transactionsResponse,
      ] = await Promise.all([
        api.get("/customers"),
        api.get("/accounts"),
        api.get("/transactions"),
      ]);

      setCustomers(customersResponse.data || []);
      setAccounts(accountsResponse.data || []);
      setTransactions(
        transactionsResponse.data || []
      );
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load administrator data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const deposits = transactions
      .filter(
        (transaction) =>
          String(
            transaction.type || ""
          ).toUpperCase() === "DEPOSIT"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const withdrawals = transactions
      .filter(
        (transaction) =>
          String(
            transaction.type || ""
          ).toUpperCase() === "WITHDRAW"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const transfers = transactions
      .filter(
        (transaction) =>
          String(
            transaction.type || ""
          ).toUpperCase() === "TRANSFER"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const totalBalance = accounts.reduce(
      (total, account) =>
        total +
        Number(account.balance || 0),
      0
    );

    return {
      customers: customers.length,
      accounts: accounts.length,
      transactions: transactions.length,
      deposits,
      withdrawals,
      transfers,
      totalBalance,
    };
  }, [
    customers,
    accounts,
    transactions,
  ]);

  /* =======================================================
     CUSTOMER FILTER
  ======================================================= */

  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [customers, search]);

  /* =======================================================
     ACCOUNT FILTER
  ======================================================= */

  const filteredAccounts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return accounts;

    return accounts.filter((account) =>
      [
        account.id,
        account.accountNumber,
        account.accountType,
        account.customerId,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [accounts, search]);

  /* =======================================================
     TRANSACTION FILTER
  ======================================================= */

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (transactionFilter !== "ALL") {
      result = result.filter(
        (transaction) =>
          String(
            transaction.type || ""
          ).toUpperCase() ===
          transactionFilter
      );
    }

    const query = search
      .trim()
      .toLowerCase();

    if (query) {
      result = result.filter(
        (transaction) =>
          [
            transaction.id,
            transaction.transactionId,
            transaction.accountNumber,
            transaction.type,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          )
      );
    }

    return result;
  }, [
    transactions,
    search,
    transactionFilter,
  ]);

  /* =======================================================
     DELETE CUSTOMER
  ======================================================= */

  const handleDeleteCustomer = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/customers/${id}`);

      setCustomers((current) =>
        current.filter(
          (customer) =>
            customer.id !== id
        )
      );

      setSelectedCustomer(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to delete customer."
      );
    }
  };

  /* =======================================================
     TAB CHANGE
  ======================================================= */

  const handleTabChange = (_, value) => {
    setActiveTab(value);
    setSearch("");
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <Box sx={adminUI.page}>
      {/* ===================================================
          HEADER
      =================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack
          direction="row"
          spacing={1.75}
          alignItems="center"
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              background:
                "linear-gradient(135deg,#1d4ed8 0%,#2563eb 55%,#3b82f6 100%)",
              boxShadow:
                "0 8px 20px rgba(37,99,235,.25)",
            }}
          >
            <AdminPanelSettings
              sx={{ fontSize: 27 }}
            />
          </Box>

          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "1.5rem",
                    sm: "1.75rem",
                    md: "2rem",
                  },
                  fontWeight: 850,
                  color: "#0f172a",
                  letterSpacing: "-0.045em",
                  lineHeight: 1.1,
                }}
              >
                Administration
              </Typography>

              <Chip
                label="ADMIN"
                size="small"
                sx={{
                  height: 22,
                  borderRadius: "6px",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  color: "#1d4ed8",
                  backgroundColor: "#eff6ff",
                  border:
                    "1px solid #dbeafe",
                }}
              />
            </Stack>

            <Typography
              sx={{
                mt: 0.6,
                fontSize: "0.82rem",
                color: "#64748b",
              }}
            >
              Banking operations, customer
              management and system monitoring
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          justifyContent={{
            xs: "flex-start",
            md: "flex-end",
          }}
        >
          <Tooltip title="Refresh dashboard">
            <IconButton
              onClick={loadAdminData}
              sx={{
                width: 42,
                height: 42,
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                color: "#475569",
                "&:hover": {
                  backgroundColor:
                    "#f8fafc",
                  borderColor:
                    "#cbd5e1",
                },
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{
              minHeight: 42,
              px: 2,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 750,
              fontSize: "0.84rem",
              boxShadow:
                "0 4px 12px rgba(37,99,235,.18)",
              "&:hover": {
                boxShadow:
                  "0 7px 18px rgba(37,99,235,.25)",
              },
            }}
          >
            Export Report
          </Button>
        </Stack>
      </Stack>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "12px",
            border: "1px solid #fecaca",
          }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* ===================================================
          KPI
      =================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            lg: "repeat(4,1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          title="Total Customers"
          value={formatNumber(
            statistics.customers
          )}
          subtitle="Registered customers"
          icon={<People />}
          loading={loading}
        />

        <StatCard
          title="Total Accounts"
          value={formatNumber(
            statistics.accounts
          )}
          subtitle="Bank accounts"
          icon={<AccountBalance />}
          loading={loading}
        />

        <StatCard
          title="Total Balance"
          value={formatCurrency(
            statistics.totalBalance
          )}
          subtitle="Across all accounts"
          icon={<AccountBalanceWallet />}
          loading={loading}
        />

        <StatCard
          title="Transactions"
          value={formatNumber(
            statistics.transactions
          )}
          subtitle="Recorded transactions"
          icon={<Assessment />}
          loading={loading}
        />
      </Box>

      {/* ===================================================
          ANALYTICS
      =================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "2fr 1fr",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {/* TRANSACTION OVERVIEW */}

        <Card
          sx={{
            ...adminUI.surface,
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
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
              spacing={1.5}
              mb={2.5}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 850,
                    color: "#0f172a",
                  }}
                >
                  Transaction Overview
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: "0.78rem",
                    color: "#64748b",
                  }}
                >
                  Banking activity across the
                  platform
                </Typography>
              </Box>

              <Select
                size="small"
                defaultValue="30"
                sx={{
                  minWidth: 130,
                  height: 38,
                  borderRadius: "9px",
                  fontSize: "0.78rem",
                  backgroundColor: "#f8fafc",
                }}
              >
                <MenuItem value="7">
                  Last 7 days
                </MenuItem>

                <MenuItem value="30">
                  Last 30 days
                </MenuItem>

                <MenuItem value="90">
                  Last 90 days
                </MenuItem>
              </Select>
            </Stack>

            <Box
              sx={{
                height: 230,
                position: "relative",
                overflow: "hidden",
                borderRadius: "12px",
                border:
                  "1px solid #eef2f7",
                background:
                  "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)",
                  backgroundSize:
                    "100% 46px,80px 100%",
                  opacity: 0.45,
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  left: 20,
                  right: 20,
                  bottom: 28,
                  height: 120,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 1.2,
                }}
              >
                {[
                  38,
                  58,
                  46,
                  72,
                  61,
                  86,
                  68,
                  96,
                  76,
                  110,
                  88,
                  122,
                ].map(
                  (height, index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        maxWidth: 32,
                        height,
                        borderRadius:
                          "6px 6px 2px 2px",
                        background:
                          index === 11
                            ? "linear-gradient(180deg,#2563eb,#60a5fa)"
                            : "linear-gradient(180deg,#bfdbfe,#dbeafe)",
                        transition:
                          "height 250ms ease",
                        "&:hover": {
                          background:
                            "linear-gradient(180deg,#2563eb,#60a5fa)",
                        },
                      }}
                    />
                  )
                )}
              </Box>

              <Typography
                sx={{
                  position: "absolute",
                  left: 20,
                  bottom: 8,
                  fontSize: "0.65rem",
                  color: "#94a3b8",
                }}
              >
                Transaction activity
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* FINANCIAL SUMMARY */}

        <Card
          sx={{
            ...adminUI.surface,
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 850,
                color: "#0f172a",
              }}
            >
              Financial Summary
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                mb: 2.5,
                fontSize: "0.78rem",
                color: "#64748b",
              }}
            >
              Current transaction volume
            </Typography>

            <Stack spacing={2}>
              <FinancialRow
                label="Deposits"
                description="Money deposited"
                value={statistics.deposits}
                icon={<ArrowDownward />}
              />

              <FinancialRow
                label="Withdrawals"
                description="Money withdrawn"
                value={statistics.withdrawals}
                icon={<ArrowUpward />}
              />

              <FinancialRow
                label="Transfers"
                description="Fund transfers"
                value={statistics.transfers}
                icon={<SwapHoriz />}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* ===================================================
          MANAGEMENT
      =================================================== */}

      <Card
        sx={{
          ...adminUI.surface,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            borderBottom:
              "1px solid #e2e8f0",
            overflowX: "auto",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 56,

              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius:
                  "3px 3px 0 0",
              },
            }}
          >
            <Tab
              icon={
                <Dashboard
                  sx={{ fontSize: 18 }}
                />
              }
              iconPosition="start"
              label="Overview"
              sx={adminUI.tab}
            />

            <Tab
              icon={
                <People
                  sx={{ fontSize: 18 }}
                />
              }
              iconPosition="start"
              label="Customers"
              sx={adminUI.tab}
            />

            <Tab
              icon={
                <AccountBalance
                  sx={{ fontSize: 18 }}
                />
              }
              iconPosition="start"
              label="Accounts"
              sx={adminUI.tab}
            />

            <Tab
              icon={
                <History
                  sx={{ fontSize: 18 }}
                />
              }
              iconPosition="start"
              label="Transactions"
              sx={adminUI.tab}
            />

            <Tab
              icon={
                <Security
                  sx={{ fontSize: 18 }}
                />
              }
              iconPosition="start"
              label="Security"
              sx={adminUI.tab}
            />
          </Tabs>
        </Box>

        {/* TOOLBAR */}

        {activeTab !== 0 &&
          activeTab !== 4 && (
            <Box sx={adminUI.toolbar}>
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{
                  xs: "stretch",
                  md: "center",
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder={
                    activeTab === 1
                      ? "Search customers by name, email or ID..."
                      : activeTab === 2
                      ? "Search accounts by number or customer..."
                      : "Search transactions..."
                  }
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  sx={{
                    ...adminUI.input,
                    maxWidth: {
                      md: 520,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search
                          sx={{
                            fontSize: 19,
                            color: "#94a3b8",
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                {activeTab === 3 && (
                  <Select
                    size="small"
                    value={
                      transactionFilter
                    }
                    onChange={(e) =>
                      setTransactionFilter(
                        e.target.value
                      )
                    }
                    sx={{
                      minWidth: {
                        xs: "100%",
                        md: 180,
                      },
                      height: 42,
                      borderRadius: "10px",
                      backgroundColor:
                        "#f8fafc",
                    }}
                  >
                    <MenuItem value="ALL">
                      All Transactions
                    </MenuItem>

                    <MenuItem value="DEPOSIT">
                      Deposits
                    </MenuItem>

                    <MenuItem value="WITHDRAW">
                      Withdrawals
                    </MenuItem>

                    <MenuItem value="TRANSFER">
                      Transfers
                    </MenuItem>
                  </Select>
                )}
              </Stack>
            </Box>
          )}

        {/* OVERVIEW */}

        {activeTab === 0 && (
          <OverviewPanel
            customers={customers}
            accounts={accounts}
            transactions={transactions}
            statistics={statistics}
          />
        )}

        {/* CUSTOMERS */}

        {activeTab === 1 && (
          <CustomerTable
            customers={filteredCustomers}
            accounts={accounts}
            onSelect={setSelectedCustomer}
            onDelete={handleDeleteCustomer}
          />
        )}

        {/* ACCOUNTS */}

        {activeTab === 2 && (
          <AccountTable
            accounts={filteredAccounts}
            onSelect={setSelectedAccount}
          />
        )}

        {/* TRANSACTIONS */}

        {activeTab === 3 && (
          <TransactionTable
            transactions={
              filteredTransactions
            }
          />
        )}

        {/* SECURITY */}

        {activeTab === 4 && (
          <SecurityPanel />
        )}
      </Card>

      {/* ===================================================
          CUSTOMER DETAIL
      =================================================== */}

      {selectedCustomer && (
        <DetailPanel
          title="Customer Details"
          onClose={() =>
            setSelectedCustomer(null)
          }
        >
          <DetailItem
            label="Customer ID"
            value={selectedCustomer.id}
          />

          <DetailItem
            label="Full Name"
            value={selectedCustomer.name}
          />

          <DetailItem
            label="Email"
            value={selectedCustomer.email}
          />

          <DetailItem
            label="Phone"
            value={selectedCustomer.phone}
          />

          <DetailItem
            label="Status"
            value={
              <StatusChip
                status={
                  selectedCustomer.status ||
                  "ACTIVE"
                }
              />
            }
          />

          <Divider sx={{ my: 2.5 }} />

          <Typography
            sx={{
              mb: 1.5,
              fontSize: "0.9rem",
              fontWeight: 850,
              color: "#0f172a",
            }}
          >
            Customer Accounts
          </Typography>

          {accounts.filter(
            (account) =>
              String(
                account.customerId
              ) ===
              String(
                selectedCustomer.id
              )
          ).length === 0 ? (
            <Paper
              sx={{
                p: 2,
                borderRadius: "10px",
                backgroundColor:
                  "#f8fafc",
                border:
                  "1px solid #eef2f7",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                No accounts linked to
                this customer.
              </Typography>
            </Paper>
          ) : (
            accounts
              .filter(
                (account) =>
                  String(
                    account.customerId
                  ) ===
                  String(
                    selectedCustomer.id
                  )
              )
              .map((account) => (
                <Paper
                  key={
                    account.id ||
                    account.accountNumber
                  }
                  sx={{
                    p: 1.75,
                    mb: 1.25,
                    borderRadius: "11px",
                    border:
                      "1px solid #e2e8f0",
                    backgroundColor:
                      "#ffffff",
                    transition:
                      "all 160ms ease",
                    "&:hover": {
                      borderColor:
                        "#bfdbfe",
                      backgroundColor:
                        "#f8fbff",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize:
                            "0.82rem",
                          fontWeight: 800,
                        }}
                      >
                        {
                          account.accountNumber
                        }
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.25,
                          fontSize:
                            "0.7rem",
                          color:
                            "#64748b",
                        }}
                      >
                        {account.accountType ||
                          "Bank Account"}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize:
                          "0.85rem",
                        fontWeight: 850,
                      }}
                    >
                      {formatCurrency(
                        account.balance
                      )}
                    </Typography>
                  </Stack>
                </Paper>
              ))
          )}
        </DetailPanel>
      )}

      {/* ===================================================
          ACCOUNT DETAIL
      =================================================== */}

      {selectedAccount && (
        <DetailPanel
          title="Account Details"
          onClose={() =>
            setSelectedAccount(null)
          }
        >
          <DetailItem
            label="Account Number"
            value={
              selectedAccount.accountNumber
            }
          />

          <DetailItem
            label="Account Type"
            value={
              selectedAccount.accountType
            }
          />

          <DetailItem
            label="Current Balance"
            value={formatCurrency(
              selectedAccount.balance
            )}
          />

          <DetailItem
            label="Customer ID"
            value={
              selectedAccount.customerId
            }
          />

          <DetailItem
            label="Status"
            value={
              <StatusChip
                status={
                  selectedAccount.status ||
                  "ACTIVE"
                }
              />
            }
          />

          <Divider sx={{ my: 2.5 }} />

          <Stack spacing={1.25}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Lock />}
              disabled
              sx={{
                minHeight: 44,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 750,
              }}
            >
              Freeze Account
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Block />}
              disabled
              sx={{
                minHeight: 44,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 750,
              }}
            >
              Block Account
            </Button>

            <Typography
              sx={{
                pt: 0.5,
                fontSize: "0.68rem",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              Account controls will be
              enabled when the corresponding
              backend operations are available.
            </Typography>
          </Stack>
        </DetailPanel>
      )}
    </Box>
  );
}

/* =========================================================
   FINANCIAL ROW
========================================================= */

function FinancialRow({
  label,
  description,
  value,
  icon,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        p: 1.25,
        borderRadius: "10px",
        transition:
          "background-color 160ms ease",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#eff6ff",
          color: "#2563eb",
        }}
      >
        {icon}
      </Box>

      <Box flex={1} minWidth={0}>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontSize: "0.68rem",
            color: "#94a3b8",
          }}
        >
          {description}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: "0.82rem",
          fontWeight: 850,
          color: "#0f172a",
          whiteSpace: "nowrap",
        }}
      >
        {formatCurrency(value)}
      </Typography>
    </Stack>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewPanel({
  customers,
  accounts,
  transactions,
}) {
  const recentTransactions = [
    ...transactions,
  ]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt ||
            b.timestamp ||
            b.date ||
            0
        ) -
        new Date(
          a.createdAt ||
            a.timestamp ||
            a.date ||
            0
        )
    )
    .slice(0, 5);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3,1fr)",
          },
          gap: 1.5,
          mb: 3,
        }}
      >
        <QuickAction
          icon={<PersonAdd />}
          title="Customer Management"
          description={`${formatNumber(
            customers.length
          )} registered customers`}
        />

        <QuickAction
          icon={<AccountBalance />}
          title="Account Management"
          description={`${formatNumber(
            accounts.length
          )} bank accounts`}
        />

        <QuickAction
          icon={<History />}
          title="Transaction Monitoring"
          description={`${formatNumber(
            transactions.length
          )} transactions`}
        />
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 850,
              color: "#0f172a",
            }}
          >
            Recent Activity
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              fontSize: "0.7rem",
              color: "#94a3b8",
            }}
          >
            Latest banking transactions
          </Typography>
        </Box>

        <History
          sx={{
            fontSize: 20,
            color: "#94a3b8",
          }}
        />
      </Stack>

      {recentTransactions.length === 0 ? (
        <EmptyState text="No recent transactions." />
      ) : (
        <Box
          sx={{
            border:
              "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {recentTransactions.map(
            (transaction, index) => (
              <Box
                key={
                  transaction.id ||
                  transaction.transactionId ||
                  index
                }
                sx={{
                  px: {
                    xs: 1.5,
                    sm: 2,
                  },
                  py: 1.5,
                  borderBottom:
                    index !==
                    recentTransactions.length -
                      1
                      ? "1px solid #eef2f7"
                      : "none",
                  transition:
                    "background-color 160ms ease",
                  "&:hover": {
                    backgroundColor:
                      "#f8fafc",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      backgroundColor:
                        "#eff6ff",
                      color: "#2563eb",
                    }}
                  >
                    <SwapHoriz
                      sx={{ fontSize: 19 }}
                    />
                  </Avatar>

                  <Box flex={1} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize:
                          "0.78rem",
                        fontWeight: 800,
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {transaction.transactionId ||
                        transaction.id ||
                        "Transaction"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize:
                          "0.66rem",
                        color:
                          "#94a3b8",
                      }}
                    >
                      {formatDate(
                        transaction.createdAt ||
                          transaction.timestamp ||
                          transaction.date
                      )}
                    </Typography>
                  </Box>

                  <TransactionType
                    type={
                      transaction.type
                    }
                  />

                  <Typography
                    sx={{
                      minWidth: {
                        xs: 80,
                        sm: 120,
                      },
                      textAlign:
                        "right",
                      fontSize:
                        "0.78rem",
                      fontWeight: 850,
                    }}
                  >
                    {formatCurrency(
                      transaction.amount
                    )}
                  </Typography>
                </Stack>
              </Box>
            )
          )}
        </Box>
      )}
    </Box>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  title,
  description,
}) {
  return (
    <Paper
      sx={{
        p: 1.75,
        borderRadius: "12px",
        border:
          "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        boxShadow:
          "0 1px 2px rgba(15,23,42,.02)",
        transition:
          "all 180ms ease",

        "&:hover": {
          borderColor: "#bfdbfe",
          backgroundColor: "#f8fbff",
          transform: "translateY(-1px)",
          boxShadow:
            "0 8px 20px rgba(15,23,42,.05)",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg,#eff6ff,#dbeafe)",
            color: "#2563eb",
          }}
        >
          {icon}
        </Box>

        <Box minWidth={0}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 850,
              color: "#0f172a",
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              fontSize: "0.68rem",
              color: "#94a3b8",
            }}
          >
            {description}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/* =========================================================
   CUSTOMER TABLE
========================================================= */

function CustomerTable({
  customers,
  accounts,
  onSelect,
  onDelete,
}) {
  if (!customers.length) {
    return (
      <EmptyState text="No customers found." />
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      {/* HEADER */}

      <Box
        sx={{
          ...adminUI.tableHeader,
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
        >
          <Box sx={{ width: 42 }} />

          <Typography
            sx={{
              flex: 1,
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.05em",
            }}
          >
            Customer
          </Typography>

          <Typography
            sx={{
              width: 230,
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.05em",
            }}
          >
            Contact
          </Typography>

          <Typography
            sx={{
              width: 90,
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.05em",
            }}
          >
            Accounts
          </Typography>

          <Typography
            sx={{
              width: 90,
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.05em",
            }}
          >
            Status
          </Typography>

          <Box width={90} />
        </Stack>
      </Box>

      {customers.map((customer) => {
        const accountCount =
          accounts.filter(
            (account) =>
              String(
                account.customerId
              ) ===
              String(customer.id)
          ).length;

        return (
          <Box
            key={customer.id}
            sx={{
              ...adminUI.tableRow,
              minWidth: 850,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  background:
                    "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  boxShadow:
                    "0 4px 10px rgba(37,99,235,.18)",
                }}
              >
                {(customer.name ||
                  "C")
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>

              <Box flex={1} minWidth={180}>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {customer.name ||
                    "Unnamed Customer"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: "0.66rem",
                    color: "#94a3b8",
                  }}
                >
                  ID: {customer.id}
                </Typography>
              </Box>

              <Box width={230}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#334155",
                  }}
                >
                  {customer.email ||
                    "—"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: "0.65rem",
                    color: "#94a3b8",
                  }}
                >
                  {customer.phone ||
                    "No phone number"}
                </Typography>
              </Box>

              <Box width={90}>
                <Chip
                  size="small"
                  label={`${accountCount} ${
                    accountCount ===
                    1
                      ? "account"
                      : "accounts"
                  }`}
                  sx={{
                    height: 25,
                    borderRadius: "7px",
                    fontSize: "0.65rem",
                    fontWeight: 750,
                    backgroundColor:
                      "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                    color: "#475569",
                  }}
                />
              </Box>

              <Box width={90}>
                <StatusChip
                  status={
                    customer.status ||
                    "ACTIVE"
                  }
                />
              </Box>

              <Stack
                direction="row"
                spacing={0.5}
                width={90}
                justifyContent="flex-end"
              >
                <Tooltip title="View customer">
                  <IconButton
                    size="small"
                    onClick={() =>
                      onSelect(customer)
                    }
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      color: "#64748b",
                      "&:hover": {
                        backgroundColor:
                          "#eff6ff",
                        color:
                          "#2563eb",
                      },
                    }}
                  >
                    <ChevronRight
                      fontSize="small"
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete customer">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      onDelete(
                        customer.id
                      )
                    }
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                    }}
                  >
                    <Block
                      sx={{
                        fontSize: 17,
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

/* =========================================================
   ACCOUNT TABLE
========================================================= */

function AccountTable({
  accounts,
  onSelect,
}) {
  if (!accounts.length) {
    return (
      <EmptyState text="No accounts found." />
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box
        sx={{
          ...adminUI.tableHeader,
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Box width={42} />

          <Typography
            sx={{
              flex: 1,
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Account
          </Typography>

          <Typography
            width={160}
            sx={{
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Type
          </Typography>

          <Typography
            width={160}
            sx={{
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Balance
          </Typography>

          <Typography
            width={90}
            sx={{
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Status
          </Typography>

          <Box width={40} />
        </Stack>
      </Box>

      {accounts.map((account) => (
        <Box
          key={
            account.id ||
            account.accountNumber
          }
          sx={{
            ...adminUI.tableRow,
            minWidth: 850,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 42,
                height: 42,
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg,#eff6ff,#dbeafe)",
                color: "#2563eb",
              }}
            >
              <AccountBalance
                sx={{ fontSize: 20 }}
              />
            </Avatar>

            <Box flex={1} minWidth={180}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                }}
              >
                {account.accountNumber ||
                  "Account"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: "0.66rem",
                  color: "#94a3b8",
                }}
              >
                Customer:{" "}
                {account.customerId ||
                  "—"}
              </Typography>
            </Box>

            <Box width={160}>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: "#94a3b8",
                }}
              >
                Account type
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: "0.75rem",
                  fontWeight: 750,
                }}
              >
                {account.accountType ||
                  "Savings"}
              </Typography>
            </Box>

            <Box width={160}>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: "#94a3b8",
                }}
              >
                Balance
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: "0.8rem",
                  fontWeight: 850,
                }}
              >
                {formatCurrency(
                  account.balance
                )}
              </Typography>
            </Box>

            <Box width={90}>
              <StatusChip
                status={
                  account.status ||
                  "ACTIVE"
                }
              />
            </Box>

            <IconButton
              size="small"
              onClick={() =>
                onSelect(account)
              }
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                color: "#64748b",
                "&:hover": {
                  backgroundColor:
                    "#eff6ff",
                  color: "#2563eb",
                },
              }}
            >
              <ChevronRight
                fontSize="small"
              />
            </IconButton>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

/* =========================================================
   TRANSACTION TABLE
========================================================= */

function TransactionTable({
  transactions,
}) {
  if (!transactions.length) {
    return (
      <EmptyState text="No transactions found." />
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box
        sx={{
          ...adminUI.tableHeader,
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Box width={42} />

          <Typography
            sx={{
              flex: 1,
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Transaction
          </Typography>

          <Typography
            width={110}
            sx={{
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Type
          </Typography>

          <Typography
            width={130}
            textAlign="right"
            sx={{
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Amount
          </Typography>

          <Typography
            width={100}
            sx={{
              fontSize: "0.67rem",
              fontWeight: 800,
              color: "#64748b",
              textTransform:
                "uppercase",
            }}
          >
            Status
          </Typography>

          <Box width={40} />
        </Stack>
      </Box>

      {transactions.map(
        (transaction, index) => {
          const type = String(
            transaction.type || ""
          ).toUpperCase();

          return (
            <Box
              key={
                transaction.id ||
                transaction.transactionId ||
                index
              }
              sx={{
                ...adminUI.tableRow,
                minWidth: 900,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor:
                      type === "DEPOSIT"
                        ? "#ecfdf5"
                        : type ===
                          "WITHDRAW"
                        ? "#fff7ed"
                        : "#eff6ff",
                    color:
                      type === "DEPOSIT"
                        ? "#16a34a"
                        : type ===
                          "WITHDRAW"
                        ? "#ea580c"
                        : "#2563eb",
                  }}
                >
                  {type ===
                  "DEPOSIT" ? (
                    <ArrowDownward
                      sx={{
                        fontSize: 19,
                      }}
                    />
                  ) : type ===
                    "WITHDRAW" ? (
                    <ArrowUpward
                      sx={{
                        fontSize: 19,
                      }}
                    />
                  ) : (
                    <SwapHoriz
                      sx={{
                        fontSize: 19,
                      }}
                    />
                  )}
                </Avatar>

                <Box
                  flex={1}
                  minWidth={180}
                >
                  <Typography
                    sx={{
                      fontSize:
                        "0.78rem",
                      fontWeight: 800,
                    }}
                  >
                    {transaction.transactionId ||
                      transaction.id ||
                      "Transaction"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      fontSize:
                        "0.65rem",
                      color:
                        "#94a3b8",
                    }}
                  >
                    {formatDate(
                      transaction.createdAt ||
                        transaction.timestamp ||
                        transaction.date
                    )}
                  </Typography>
                </Box>

                <Box width={110}>
                  <TransactionType
                    type={
                      transaction.type
                    }
                  />
                </Box>

                <Typography
                  width={130}
                  textAlign="right"
                  sx={{
                    fontSize:
                      "0.8rem",
                    fontWeight: 850,
                  }}
                >
                  {formatCurrency(
                    transaction.amount
                  )}
                </Typography>

                <Box width={100}>
                  <StatusChip
                    status={
                      transaction.status ||
                      "COMPLETED"
                    }
                  />
                </Box>

                <IconButton
                  size="small"
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "8px",
                    color: "#64748b",
                  }}
                >
                  <MoreHoriz
                    fontSize="small"
                  />
                </IconButton>
              </Stack>
            </Box>
          );
        }
      )}
    </Box>
  );
}

/* =========================================================
   SECURITY
========================================================= */

function SecurityPanel() {
  const securityItems = [
    {
      title: "JWT Authentication",
      description:
        "Authenticated API requests are protected by JWT.",
      icon: <Security />,
      status: "Protected",
    },

    {
      title: "Role Based Access",
      description:
        "Administrative operations require ADMIN privileges.",
      icon: <AdminPanelSettings />,
      status: "Protected",
    },

    {
      title: "Account Protection",
      description:
        "Monitor account activity and account status.",
      icon: <Lock />,
      status: "Enabled",
    },

    {
      title: "Audit Monitoring",
      description:
        "Track administrative and financial operations.",
      icon: <History />,
      status: "Enabled",
    },
  ];

  return (
    <Box
      sx={{
        p: {
          xs: 1.5,
          sm: 2.5,
          md: 3,
        },
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
        spacing={1.5}
        mb={3}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 850,
              color: "#0f172a",
            }}
          >
            Security Center
          </Typography>

          <Typography
            sx={{
              mt: 0.35,
              fontSize: "0.78rem",
              color: "#64748b",
            }}
          >
            Monitor security controls and
            administrative access.
          </Typography>
        </Box>

        <Chip
          icon={
            <CheckCircle
              sx={{ fontSize: 16 }}
            />
          }
          label="System Protected"
          sx={{
            height: 29,
            borderRadius: "8px",
            color: "#15803d",
            backgroundColor:
              "#f0fdf4",
            border:
              "1px solid #bbf7d0",
            fontWeight: 800,
            fontSize: "0.7rem",
          }}
        />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2,1fr)",
          },
          gap: 1.5,
        }}
      >
        {securityItems.map((item) => (
          <Paper
            key={item.title}
            sx={{
              p: 2.25,
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              border:
                "1px solid #e2e8f0",
              boxShadow:
                "0 1px 2px rgba(15,23,42,.03)",
              transition: "all 180ms ease",

              "&:hover": {
                borderColor: "#bfdbfe",
                boxShadow:
                  "0 8px 24px rgba(15,23,42,.06)",
                transform:
                  "translateY(-1px)",
              },
            }}
          >
            <Stack
              direction="row"
              spacing={2}
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "11px",
                  background:
                    "linear-gradient(135deg,#eff6ff,#dbeafe)",
                  color: "#2563eb",
                }}
              >
                {item.icon}
              </Avatar>

              <Box flex={1}>
                <Typography
                  sx={{
                    fontSize:
                      "0.82rem",
                    fontWeight: 850,
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize:
                      "0.72rem",
                    lineHeight: 1.55,
                    color:
                      "#64748b",
                  }}
                >
                  {item.description}
                </Typography>

                <Chip
                  size="small"
                  label={item.status}
                  sx={{
                    mt: 1.5,
                    height: 25,
                    borderRadius: "7px",
                    backgroundColor:
                      "#f0fdf4",
                    border:
                      "1px solid #bbf7d0",
                    color:
                      "#15803d",
                    fontSize:
                      "0.66rem",
                    fontWeight: 800,
                  }}
                />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Alert
        severity="info"
        icon={<Warning />}
        sx={{
          mt: 2,
          borderRadius: "11px",
          fontSize: "0.75rem",
          border:
            "1px solid #bfdbfe",
        }}
      >
        Security controls must also be enforced
        server-side using Spring Security. Hiding
        administrative controls in React is not a
        security mechanism.
      </Alert>
    </Box>
  );
}

/* =========================================================
   DETAIL PANEL
========================================================= */

function DetailPanel({
  title,
  onClose,
  children,
}) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        backgroundColor:
          "rgba(15,23,42,.42)",
        backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <Box
        onClick={(event) =>
          event.stopPropagation()
        }
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: {
            xs: "100%",
            sm: 440,
            md: 480,
          },
          height: "100%",
          backgroundColor: "#ffffff",
          boxShadow:
            "-20px 0 60px rgba(15,23,42,.16)",
          overflowY: "auto",

          animation:
            "adminDrawerIn 220ms ease-out",

          "@keyframes adminDrawerIn": {
            from: {
              transform:
                "translateX(100%)",
            },

            to: {
              transform:
                "translateX(0)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            px: 2.5,
            py: 2,
            backgroundColor:
              "rgba(255,255,255,.94)",
            backdropFilter:
              "blur(10px)",
            borderBottom:
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
                sx={{
                  fontSize: "1rem",
                  fontWeight: 850,
                  color: "#0f172a",
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                }}
              >
                Banking management details
              </Typography>
            </Box>

            <IconButton
              onClick={onClose}
              sx={{
                width: 36,
                height: 36,
                borderRadius: "9px",
                color: "#64748b",
                "&:hover": {
                  backgroundColor:
                    "#f1f5f9",
                  color: "#0f172a",
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Box
          sx={{
            p: {
              xs: 2,
              sm: 2.5,
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.5,
        borderRadius: "10px",
        backgroundColor: "#f8fafc",
        border:
          "1px solid #eef2f7",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.67rem",
          fontWeight: 800,
          color: "#94a3b8",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.04em",
        }}
      >
        {label}
      </Typography>

      <Box sx={{ mt: 0.6 }}>
        {typeof value === "string" ||
        typeof value === "number" ? (
          <Typography
            sx={{
              fontSize: "0.86rem",
              fontWeight: 700,
              color: "#0f172a",
              wordBreak:
                "break-word",
            }}
          >
            {value || "—"}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
  return (
    <Box
      sx={{
        py: 8,
        px: 2,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 58,
          height: 58,
          mx: "auto",
          mb: 1.5,
          borderRadius: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          border:
            "1px solid #e2e8f0",
        }}
      >
        <Assessment
          sx={{
            fontSize: 28,
            color: "#94a3b8",
          }}
        />
      </Box>

      <Typography
        sx={{
          color: "#475569",
          fontSize: "0.82rem",
          fontWeight: 700,
        }}
      >
        {text}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: "0.7rem",
          color: "#94a3b8",
        }}
      >
        Try adjusting your search or filters.
      </Typography>
    </Box>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default Admin;