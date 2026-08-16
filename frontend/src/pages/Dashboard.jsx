import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import api from "../services/api";

const PAGE_SIZE = 6;

const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  navy: "#0f172a",
  text: "#1e293b",
  muted: "#64748b",
  lightMuted: "#94a3b8",
  border: "#e2e8f0",
  background: "#f8fafc",
  white: "#ffffff",
  green: "#059669",
  greenBg: "#ecfdf5",
  red: "#dc2626",
  redBg: "#fef2f2",
  blueBg: "#eff6ff",
  orange: "#ea580c",
  orangeBg: "#fff7ed",
  purple: "#7c3aed",
  purpleBg: "#f5f3ff",
};

function Dashboard() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountDialog, setAccountDialog] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadDashboard = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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

      setCustomers(
        Array.isArray(customersResponse?.data)
          ? customersResponse.data
          : []
      );

      setAccounts(
        Array.isArray(accountsResponse?.data)
          ? accountsResponse.data
          : []
      );

      setTransactions(
        Array.isArray(transactionsResponse?.data)
          ? transactionsResponse.data
          : []
      );
    } catch (err) {
      console.error("Dashboard loading failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalBalance = useMemo(() => {
    return accounts.reduce(
      (sum, account) => sum + Number(account?.balance || 0),
      0
    );
  }, [accounts]);

  const totalTransactions = transactions.length;

  const averageBalance = useMemo(() => {
    if (!accounts.length) return 0;

    return totalBalance / accounts.length;
  }, [accounts, totalBalance]);

  const depositTotal = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          String(transaction?.type || "").toUpperCase() === "DEPOSIT"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction?.amount || 0),
        0
      );
  }, [transactions]);

  const withdrawalTotal = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          String(transaction?.type || "").toUpperCase() === "WITHDRAW"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction?.amount || 0),
        0
      );
  }, [transactions]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatCurrency = (amount) => {
    const value = Number(amount);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  };

  const formatCompactCurrency = (amount) => {
    const value = Number(amount || 0);

    if (Math.abs(value) >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }

    if (Math.abs(value) >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }

    if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }

    return formatCurrency(value);
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getTransactionType = (transaction) => {
    return String(
      transaction?.type || "TRANSACTION"
    ).toUpperCase();
  };

  const getTransactionColor = (type) => {
    switch (String(type).toUpperCase()) {
      case "DEPOSIT":
        return COLORS.green;

      case "WITHDRAW":
        return COLORS.red;

      case "TRANSFER":
        return COLORS.primary;

      default:
        return COLORS.muted;
    }
  };

  const getTransactionBackground = (type) => {
    switch (String(type).toUpperCase()) {
      case "DEPOSIT":
        return COLORS.greenBg;

      case "WITHDRAW":
        return COLORS.redBg;

      case "TRANSFER":
        return COLORS.blueBg;

      default:
        return "#f1f5f9";
    }
  };

  const getTransactionIcon = (type) => {
    switch (String(type).toUpperCase()) {
      case "DEPOSIT":
        return <AddCircleIcon />;

      case "WITHDRAW":
        return <RemoveCircleIcon />;

      case "TRANSFER":
        return <SwapHorizIcon />;

      default:
        return <ReceiptLongOutlinedIcon />;
    }
  };

  /* =========================================================
     TRANSACTION FILTER
  ========================================================= */

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...transactions]
      .filter((transaction) => {
        const type = getTransactionType(transaction);

        if (
          transactionType !== "ALL" &&
          type !== transactionType
        ) {
          return false;
        }

        const transactionDate = transaction?.createdAt
          ? new Date(transaction.createdAt)
          : null;

        if (
          transactionDate &&
          !Number.isNaN(transactionDate.getTime())
        ) {
          if (dateFrom) {
            const from = new Date(
              `${dateFrom}T00:00:00`
            );

            if (transactionDate < from) {
              return false;
            }
          }

          if (dateTo) {
            const to = new Date(
              `${dateTo}T23:59:59.999`
            );

            if (transactionDate > to) {
              return false;
            }
          }
        }

        if (!query) return true;

        const searchableValues = [
          transaction?.id,
          transaction?.type,
          transaction?.amount,
          transaction?.description,
          transaction?.accountNumber,
          transaction?.account?.accountNumber,
          transaction?.customer?.name,
          transaction?.account?.customer?.name,
        ];

        return searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) => {
        return (
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
        );
      });
  }, [
    transactions,
    search,
    transactionType,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTransactions.length / PAGE_SIZE
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredTransactions.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredTransactions, page]);

  const clearFilters = () => {
    setSearch("");
    setTransactionType("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  /* =========================================================
     CSV
  ========================================================= */

  const escapeCsv = (value) => {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  };

  const downloadCsv = (rows, filename) => {
    if (!rows.length) return;

    const headers = [
      "ID",
      "Type",
      "Amount",
      "Account",
      "Created At",
      "Description",
    ];

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.type,
          row.amount,
          row.account,
          row.createdAt,
          row.description,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportTransactions = (rows = transactions) => {
    const data = rows.map((transaction) => ({
      id: transaction?.id,
      type: transaction?.type,
      amount: transaction?.amount,
      account:
        transaction?.accountNumber ||
        transaction?.account?.accountNumber ||
        "",
      createdAt: transaction?.createdAt,
      description: transaction?.description || "",
    }));

    downloadCsv(data, "bank-transactions.csv");
  };

  /* =========================================================
     ACCOUNT DIALOG
  ========================================================= */

  const openAccount = (account) => {
    setSelectedAccount(account);
    setAccountDialog(true);
  };

  const closeAccount = () => {
    setSelectedAccount(null);
    setAccountDialog(false);
  };

  const selectedAccountTransactions = useMemo(() => {
    if (!selectedAccount) return [];

    return transactions
      .filter((transaction) => {
        const transactionAccountId =
          transaction?.accountId ??
          transaction?.account?.id;

        return (
          String(transactionAccountId) ===
          String(selectedAccount?.id)
        );
      })
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0) -
          new Date(a?.createdAt || 0)
      );
  }, [transactions, selectedAccount]);

  const exportSelectedAccount = () => {
    if (!selectedAccount) return;

    const data = selectedAccountTransactions.map(
      (transaction) => ({
        id: transaction?.id,
        type: transaction?.type,
        amount: transaction?.amount,
        account:
          selectedAccount?.accountNumber || "",
        createdAt: transaction?.createdAt,
        description: transaction?.description || "",
      })
    );

    downloadCsv(
      data,
      `account-${selectedAccount.id}-transactions.csv`
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <DashboardLoading />
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: COLORS.background,
        px: {
          xs: 1.5,
          sm: 2.5,
          md: 3,
          lg: 4,
        },
        py: {
          xs: 2,
          sm: 3,
          lg: 4,
        },
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: {
                xs: 25,
                sm: 30,
              },
              fontWeight: 800,
              color: COLORS.navy,
              letterSpacing: "-0.8px",
            }}
          >
            Banking Dashboard
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 14,
              color: COLORS.muted,
            }}
          >
            Monitor accounts, balances and banking activity.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: {
              xs: "100%",
              md: "auto",
            },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportTransactions()}
            disabled={!transactions.length}
            sx={{
              height: 42,
              flex: {
                xs: 1,
                md: "initial",
              },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#cbd5e1",
            }}
          >
            Export
          </Button>

          <IconButton
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
            }}
          >
            <RefreshIcon
              sx={{
                animation: refreshing
                  ? "dashboardRefresh 1s linear infinite"
                  : "none",
                "@keyframes dashboardRefresh": {
                  from: {
                    transform: "rotate(0deg)",
                  },
                  to: {
                    transform: "rotate(360deg)",
                  },
                },
              }}
            />
          </IconButton>
        </Box>
      </Box>

      {refreshing && (
        <LinearProgress
          sx={{
            mb: 2,
            borderRadius: 5,
          }}
        />
      )}

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadDashboard()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* HERO */}

      <Card
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          border: "1px solid #1d4ed8",
          mb: 3,
          color: COLORS.white,
          background:
            "linear-gradient(135deg, #0f3b82 0%, #1554b8 55%, #2563eb 100%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            right: -100,
            top: -160,
            background:
              "rgba(255,255,255,0.06)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            right: 80,
            bottom: -160,
            background:
              "rgba(255,255,255,0.04)",
          }}
        />

        <CardContent
          sx={{
            position: "relative",
            zIndex: 1,
            p: {
              xs: 2.5,
              sm: 3,
              md: 4,
            },
            "&:last-child": {
              pb: {
                xs: 2.5,
                sm: 3,
                md: 4,
              },
            },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1.5fr 1fr",
              },
              gap: 4,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 46,
                    height: 46,
                    background:
                      "rgba(255,255,255,0.16)",
                    fontWeight: 800,
                  }}
                >
                  {getInitials(
                    user?.username ||
                      user?.name
                  )}
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color:
                        "rgba(255,255,255,0.7)",
                    }}
                  >
                    Welcome back
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    {user?.username ||
                      user?.name ||
                      "Banking User"}
                  </Typography>
                </Box>
              </Box>

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color:
                    "rgba(255,255,255,0.68)",
                }}
              >
                TOTAL PORTFOLIO BALANCE
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: {
                    xs: 32,
                    sm: 40,
                  },
                  fontWeight: 800,
                  letterSpacing: "-1.5px",
                }}
              >
                {formatCurrency(totalBalance)}
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  fontSize: 13,
                  color:
                    "rgba(255,255,255,0.68)",
                }}
              >
                Average balance{" "}
                {formatCurrency(averageBalance)} per account
              </Typography>
            </Box>

            <Box
              sx={{
                alignSelf: "center",
                p: 2.5,
                borderRadius: 2.5,
                background:
                  "rgba(255,255,255,0.08)",
                border:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  color:
                    "rgba(255,255,255,0.65)",
                  mb: 1.5,
                }}
              >
                ACCOUNT SUMMARY
              </Typography>

              <HeroMetric
                label="Accounts"
                value={accounts.length}
              />

              <HeroMetric
                label="Transactions"
                value={totalTransactions}
              />

              <HeroMetric
                label="Status"
                value="Active"
                chip
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* STATISTICS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered customers"
          icon={<PeopleIcon />}
          iconColor={COLORS.primary}
          iconBackground={COLORS.blueBg}
        />

        <StatCard
          title="Total Accounts"
          value={accounts.length}
          subtitle="Bank accounts"
          icon={
            <AccountBalanceWalletOutlinedIcon />
          }
          iconColor={COLORS.green}
          iconBackground={COLORS.greenBg}
        />

        <StatCard
          title="Total Balance"
          value={formatCompactCurrency(totalBalance)}
          subtitle="Across all accounts"
          icon={<AccountBalanceOutlinedIcon />}
          iconColor={COLORS.orange}
          iconBackground={COLORS.orangeBg}
          large
        />

        <StatCard
          title="Transactions"
          value={totalTransactions}
          subtitle="Recorded transactions"
          icon={
            <ReceiptLongOutlinedIcon />
          }
          iconColor={COLORS.purple}
          iconBackground={COLORS.purpleBg}
        />
      </Box>

      {/* FINANCIAL SUMMARY */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <FinancialCard
          title="Total Deposits"
          value={depositTotal}
          icon={<AddCircleIcon />}
          color={COLORS.green}
          background={COLORS.greenBg}
          description="Money deposited"
        />

        <FinancialCard
          title="Total Withdrawals"
          value={withdrawalTotal}
          icon={<RemoveCircleIcon />}
          color={COLORS.red}
          background={COLORS.redBg}
          description="Money withdrawn"
        />
      </Box>

      {/* QUICK ACTIONS */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${COLORS.border}`,
          mb: 3,
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
            "&:last-child": {
              pb: {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 800,
              color: COLORS.navy,
            }}
          >
            Quick Actions
          </Typography>

          <Typography
            sx={{
              mt: 0.3,
              mb: 2,
              fontSize: 13,
              color: COLORS.muted,
            }}
          >
            Perform common banking operations.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },
              gap: 1.5,
            }}
          >
            <ActionCard
              title="Deposit Money"
              description="Add funds"
              icon={<AddCircleIcon />}
              color={COLORS.green}
              background={COLORS.greenBg}
              onClick={() => navigate("/deposit")}
            />

            <ActionCard
              title="Withdraw Money"
              description="Withdraw funds"
              icon={<RemoveCircleIcon />}
              color={COLORS.red}
              background={COLORS.redBg}
              onClick={() => navigate("/withdraw")}
            />

            <ActionCard
              title="Transfer Funds"
              description="Send money"
              icon={<SwapHorizIcon />}
              color={COLORS.primary}
              background={COLORS.blueBg}
              onClick={() => navigate("/transfer")}
            />
          </Box>
        </CardContent>
      </Card>

      {/* MAIN GRID */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1.15fr) minmax(420px, 0.85fr)",
          },
          gap: 2,
        }}
      >
        {/* ACCOUNTS */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
          }}
        >
          <SectionHeader
            title="Your Accounts"
            subtitle="Overview of your registered accounts"
            action="View all"
            onClick={() => navigate("/accounts")}
          />

          <Divider />

          {accounts.length === 0 ? (
            <EmptyState
              title="No accounts found"
              description="No bank accounts are currently available."
            />
          ) : (
            accounts.slice(0, 6).map((account, index) => (
              <AccountRow
                key={account?.id ?? index}
                account={account}
                onDetails={() =>
                  openAccount(account)
                }
              />
            ))
          )}
        </Card>

        {/* TRANSACTIONS */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
          }}
        >
          <SectionHeader
            title="Recent Transactions"
            subtitle="Latest banking activity"
            action="View all"
            onClick={() =>
              navigate("/transactions")
            }
          />

          <Divider />

          {/* FILTERS */}

          <Box
            sx={{
              p: {
                xs: 1.5,
                sm: 2,
              },
              background: "#fbfdff",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "minmax(0, 1fr) 130px",
                },
                gap: 1,
              }}
            >
              <TextField
                size="small"
                fullWidth
                placeholder="Search transactions..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                sx={{
                  background: COLORS.white,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              <TextField
                select
                size="small"
                value={transactionType}
                onChange={(event) => {
                  setTransactionType(
                    event.target.value
                  );
                  setPage(1);
                }}
                sx={{
                  background: COLORS.white,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              >
                <MenuItem value="ALL">
                  All types
                </MenuItem>
                <MenuItem value="DEPOSIT">
                  Deposit
                </MenuItem>
                <MenuItem value="WITHDRAW">
                  Withdraw
                </MenuItem>
                <MenuItem value="TRANSFER">
                  Transfer
                </MenuItem>
              </TextField>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr auto",
                },
                gap: 1,
                mt: 1,
              }}
            >
              <TextField
                size="small"
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                sx={{
                  background: COLORS.white,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              <TextField
                size="small"
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                sx={{
                  background: COLORS.white,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              {(search ||
                transactionType !== "ALL" ||
                dateFrom ||
                dateTo) && (
                <Button
                  onClick={clearFilters}
                  sx={{
                    minHeight: 40,
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>

          <Divider />

          {filteredTransactions.length === 0 ? (
            <EmptyState
              title={
                transactions.length
                  ? "No matching transactions"
                  : "No transactions yet"
              }
              description={
                transactions.length
                  ? "Try changing your search filters."
                  : "Your banking activity will appear here."
              }
            />
          ) : (
            <>
              {visibleTransactions.map(
                (transaction, index) => (
                  <TransactionRow
                    key={
                      transaction?.id ??
                      `transaction-${index}`
                    }
                    transaction={transaction}
                    onView={() =>
                      navigate(
                        `/transactions/${transaction?.id}`
                      )
                    }
                  />
                )
              )}

              {totalPages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 2,
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) =>
                      setPage(value)
                    }
                    size="small"
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Card>
      </Box>

      {/* ACCOUNT DIALOG */}

      <AccountDetailsDialog
        open={accountDialog}
        account={selectedAccount}
        transactions={selectedAccountTransactions}
        onClose={closeAccount}
        onExport={exportSelectedAccount}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getTransactionColor={getTransactionColor}
      />
    </Box>
  );
}

/* =========================================================
   HERO METRIC
========================================================= */

function HeroMetric({ label, value, chip }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 0.8,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {label}
      </Typography>

      {chip ? (
        <Chip
          label={value}
          size="small"
          sx={{
            height: 23,
            color: "#bbf7d0",
            background:
              "rgba(34,197,94,0.18)",
            fontSize: 11,
            fontWeight: 800,
          }}
        />
      ) : (
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  large = false,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${COLORS.border}`,
        transition:
          "transform .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 10px 30px rgba(15,23,42,0.07)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.muted,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontSize: large ? 23 : 29,
                lineHeight: 1.1,
                fontWeight: 800,
                color: COLORS.navy,
                letterSpacing: "-0.6px",
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                fontSize: 11,
                color: COLORS.lightMuted,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor,
              background: iconBackground,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   FINANCIAL CARD
========================================================= */

function FinancialCard({
  title,
  value,
  icon,
  color,
  background,
  description,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.muted,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 22,
                fontWeight: 800,
                color,
              }}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(Number(value || 0))}
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                fontSize: 11,
                color: COLORS.lightMuted,
              }}
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              background,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function ActionCard({
  title,
  description,
  icon,
  color,
  background,
  onClick,
}) {
  return (
    <Button
      onClick={onClick}
      fullWidth
      sx={{
        minHeight: 76,
        px: 1.5,
        justifyContent: "flex-start",
        textTransform: "none",
        borderRadius: 2,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.text,
        background: COLORS.white,
        textAlign: "left",
        "&:hover": {
          background,
          borderColor: color,
        },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: 2,
          mr: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          background,
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            fontSize: 11,
            color: COLORS.muted,
          }}
        >
          {description}
        </Typography>
      </Box>

      <ArrowForwardIcon
        sx={{
          fontSize: 18,
          color: COLORS.lightMuted,
        }}
      />
    </Button>
  );
}

/* =========================================================
   ACCOUNT ROW
========================================================= */

function AccountRow({ account, onDetails }) {
  const balance = Number(account?.balance || 0);

  return (
    <Box
      sx={{
        px: {
          xs: 1.8,
          sm: 2.5,
        },
        py: 2,
        borderBottom: `1px solid #f1f5f9`,
        transition: "background .2s ease",
        "&:hover": {
          background: "#fafcff",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: COLORS.blueBg,
              color: COLORS.primary,
            }}
          >
            <AccountBalanceOutlinedIcon />
          </Box>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 800,
                color: COLORS.navy,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {account?.accountNumber ||
                "Account unavailable"}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                fontSize: 12,
                color: COLORS.muted,
              }}
            >
              {account?.customer?.name ||
                "Customer unavailable"}
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                fontSize: 10,
                color: COLORS.lightMuted,
              }}
            >
              Account ID: {account?.id ?? "N/A"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: {
              xs: "100%",
              sm: "auto",
            },
            justifyContent: {
              xs: "space-between",
              sm: "flex-end",
            },
          }}
        >
          <Box
            sx={{
              textAlign: {
                xs: "left",
                sm: "right",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 800,
                color: COLORS.navy,
              }}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(balance)}
            </Typography>

            <Chip
              label="Active"
              size="small"
              sx={{
                mt: 0.5,
                height: 21,
                fontSize: 10,
                fontWeight: 800,
                color: "#047857",
                background: COLORS.greenBg,
              }}
            />
          </Box>

          <IconButton
            onClick={onDetails}
            size="small"
            aria-label="Account details"
            sx={{
              color: COLORS.primary,
            }}
          >
            <MoreHorizIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   TRANSACTION ROW
========================================================= */

function TransactionRow({
  transaction,
  onView,
}) {
  const type = String(
    transaction?.type || "TRANSACTION"
  ).toUpperCase();

  const color =
    type === "DEPOSIT"
      ? COLORS.green
      : type === "WITHDRAW"
      ? COLORS.red
      : type === "TRANSFER"
      ? COLORS.primary
      : COLORS.muted;

  const background =
    type === "DEPOSIT"
      ? COLORS.greenBg
      : type === "WITHDRAW"
      ? COLORS.redBg
      : type === "TRANSFER"
      ? COLORS.blueBg
      : "#f1f5f9";

  const icon =
    type === "DEPOSIT" ? (
      <AddCircleIcon fontSize="small" />
    ) : type === "WITHDRAW" ? (
      <RemoveCircleIcon fontSize="small" />
    ) : type === "TRANSFER" ? (
      <SwapHorizIcon fontSize="small" />
    ) : (
      <ReceiptLongOutlinedIcon fontSize="small" />
    );

  const amount = Number(
    transaction?.amount || 0
  );

  return (
    <Box
      sx={{
        px: {
          xs: 1.8,
          sm: 2.5,
        },
        py: 1.8,
        borderBottom: `1px solid #f1f5f9`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              background,
            }}
          >
            {icon}
          </Box>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: COLORS.navy,
              }}
            >
              {type}
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                fontSize: 10,
                color: COLORS.lightMuted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: {
                  xs: 120,
                  sm: 180,
                },
              }}
            >
              Transaction #{transaction?.id ?? "N/A"}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,
                fontSize: 10,
                color: COLORS.lightMuted,
              }}
            >
              {transaction?.createdAt
                ? new Date(
                    transaction.createdAt
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Date unavailable"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              color,
              whiteSpace: "nowrap",
            }}
          >
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            }).format(
              Number.isFinite(amount) ? amount : 0
            )}
          </Typography>

          <Button
            size="small"
            onClick={onView}
            sx={{
              mt: 0.2,
              minWidth: "auto",
              p: 0,
              textTransform: "none",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            View
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  subtitle,
  action,
  onClick,
}) {
  return (
    <Box
      sx={{
        px: {
          xs: 1.8,
          sm: 2.5,
        },
        py: 2,
        display: "flex",
        flexDirection: {
          xs: "column",
          sm: "row",
        },
        alignItems: {
          xs: "flex-start",
          sm: "center",
        },
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 800,
            color: COLORS.navy,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.3,
            fontSize: 11,
            color: COLORS.muted,
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Button
        onClick={onClick}
        endIcon={<ArrowForwardIcon />}
        sx={{
          p: 0,
          minWidth: "auto",
          textTransform: "none",
          fontSize: 12,
          fontWeight: 800,
          color: COLORS.primary,
        }}
      >
        {action}
      </Button>
    </Box>
  );
}

/* =========================================================
   ACCOUNT DETAILS DIALOG
========================================================= */

function AccountDetailsDialog({
  open,
  account,
  transactions,
  onClose,
  onExport,
  formatCurrency,
  formatDate,
  getTransactionColor,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          fontWeight: 800,
          color: COLORS.navy,
        }}
      >
        Account Details
      </DialogTitle>

      <DialogContent dividers>
        {!account ? (
          <Typography>
            Account information unavailable.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  background: COLORS.blueBg,
                  color: COLORS.primary,
                  fontWeight: 800,
                }}
              >
                {String(
                  account?.accountNumber || "A"
                ).charAt(0)}
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  {account?.accountNumber ||
                    "Account"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: COLORS.muted,
                  }}
                >
                  {account?.customer?.name ||
                    "Customer unavailable"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: COLORS.muted,
                  letterSpacing: 0.8,
                }}
              >
                CURRENT BALANCE
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 28,
                  fontWeight: 800,
                  color: COLORS.navy,
                }}
              >
                {formatCurrency(
                  account?.balance
                )}
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 11,
                  color: COLORS.lightMuted,
                }}
              >
                Account ID: {account?.id ?? "N/A"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                Recent Transactions
              </Typography>

              <Chip
                label={transactions.length}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                }}
              />
            </Box>

            {!transactions.length ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: "center",
                }}
              >
                <ReceiptLongOutlinedIcon
                  sx={{
                    fontSize: 36,
                    color: "#cbd5e1",
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: 12,
                    color: COLORS.muted,
                  }}
                >
                  No transactions found.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0}>
                {transactions
                  .slice(0, 10)
                  .map((transaction) => {
                    const type =
                      String(
                        transaction?.type ||
                          "TRANSACTION"
                      ).toUpperCase();

                    return (
                      <Box
                        key={transaction?.id}
                        sx={{
                          py: 1.3,
                          borderBottom:
                            `1px solid #f1f5f9`,
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color:
                                getTransactionColor(
                                  type
                                ),
                            }}
                          >
                            {type}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.2,
                              fontSize: 11,
                              color: COLORS.muted,
                            }}
                          >
                            {transaction?.description ||
                              `Transaction #${transaction?.id}`}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.2,
                              fontSize: 10,
                              color:
                                COLORS.lightMuted,
                            }}
                          >
                            {formatDate(
                              transaction?.createdAt
                            )}
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            color:
                              getTransactionColor(
                                type
                              ),
                          }}
                        >
                          {formatCurrency(
                            transaction?.amount
                          )}
                        </Typography>
                      </Box>
                    );
                  })}
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
        }}
      >
        <Button
          onClick={onExport}
          disabled={!transactions.length}
          startIcon={<FileDownloadIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Export CSV
        </Button>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  description,
}) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: "center",
      }}
    >
      <ReceiptLongOutlinedIcon
        sx={{
          fontSize: 40,
          color: "#cbd5e1",
        }}
      />

      <Typography
        sx={{
          mt: 1,
          fontSize: 14,
          fontWeight: 800,
          color: COLORS.text,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: 12,
          color: COLORS.muted,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

/* =========================================================
   LOADING
========================================================= */

function DashboardLoading() {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: COLORS.background,
        px: {
          xs: 1.5,
          sm: 2.5,
          md: 3,
          lg: 4,
        },
        py: 4,
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Skeleton
            variant="text"
            width={260}
            height={42}
          />

          <Skeleton
            variant="text"
            width={360}
            height={25}
          />
        </Box>

        <Skeleton
          variant="rounded"
          height={245}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={135}
            />
          ))}
        </Box>

        <Skeleton
          variant="rounded"
          height={130}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "1fr 1fr",
            },
            gap: 2,
          }}
        >
          <Skeleton
            variant="rounded"
            height={500}
          />

          <Skeleton
            variant="rounded"
            height={500}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export default Dashboard;