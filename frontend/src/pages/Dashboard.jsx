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
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
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
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import api from "../services/api";

const PAGE_SIZE = 5;

function Dashboard() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [txSearch, setTxSearch] = useState("");
  const [txType, setTxType] = useState("ALL");
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");
  const [txPage, setTxPage] = useState(1);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  /* =========================
     LOAD DASHBOARD
  ========================= */

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
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
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================
     DASHBOARD STATISTICS
  ========================= */

  const totalBalance = useMemo(() => {
    return accounts.reduce(
      (total, account) => total + Number(account?.balance || 0),
      0
    );
  }, [accounts]);

  const totalTransactions = transactions.length;

  /* =========================
     HELPERS
  ========================= */

  const formatCurrency = (amount) => {
    const value = Number(amount);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
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
    return String(transaction?.type || "TRANSACTION").toUpperCase();
  };

  const getTransactionColor = (type) => {
    switch (String(type).toUpperCase()) {
      case "DEPOSIT":
        return "#059669";

      case "WITHDRAW":
        return "#dc2626";

      case "TRANSFER":
        return "#2563eb";

      default:
        return "#64748b";
    }
  };

  const getTransactionBackground = (type) => {
    switch (String(type).toUpperCase()) {
      case "DEPOSIT":
        return "#ecfdf5";

      case "WITHDRAW":
        return "#fef2f2";

      case "TRANSFER":
        return "#eff6ff";

      default:
        return "#f8fafc";
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

  /* =========================
     TRANSACTION FILTERING
  ========================= */

  const filteredTransactions = useMemo(() => {
    const search = txSearch.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        if (!transaction) return false;

        const type = getTransactionType(transaction);

        if (txType !== "ALL" && type !== txType) {
          return false;
        }

        const transactionDate = transaction?.createdAt
          ? new Date(transaction.createdAt)
          : null;

        if (
          transactionDate &&
          Number.isNaN(transactionDate.getTime()) === false
        ) {
          if (txDateFrom) {
            const fromDate = new Date(`${txDateFrom}T00:00:00`);

            if (transactionDate < fromDate) {
              return false;
            }
          }

          if (txDateTo) {
            const toDate = new Date(`${txDateTo}T23:59:59.999`);

            if (transactionDate > toDate) {
              return false;
            }
          }
        }

        if (!search) return true;

        const values = [
          transaction?.id,
          transaction?.amount,
          transaction?.description,
          transaction?.accountNumber,
          transaction?.account?.accountNumber,
          transaction?.customer?.name,
          transaction?.account?.customer?.name,
        ];

        return values.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [
    transactions,
    txSearch,
    txType,
    txDateFrom,
    txDateTo,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (txPage > totalPages) {
      setTxPage(totalPages);
    }
  }, [txPage, totalPages]);

  const pagedTransactions = useMemo(() => {
    const start = (txPage - 1) * PAGE_SIZE;

    return filteredTransactions.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredTransactions, txPage]);

  const clearFilters = () => {
    setTxSearch("");
    setTxType("ALL");
    setTxDateFrom("");
    setTxDateTo("");
    setTxPage(1);
  };

  /* =========================
     CSV EXPORT
  ========================= */

  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? "");

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const downloadCsv = (rows, filename) => {
    if (!rows.length) {
      return;
    }

    const headers = [
      "ID",
      "Type",
      "Amount",
      "Created At",
      "Description",
    ];

    const csvRows = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.type,
          row.amount,
          row.createdAt,
          row.description,
        ]
          .map(escapeCsvValue)
          .join(",")
      ),
    ];

    const blob = new Blob(
      [csvRows.join("\n")],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportAllTransactions = () => {
    const rows = transactions.map((transaction) => ({
      id: transaction?.id,
      type: transaction?.type,
      amount: transaction?.amount,
      createdAt: transaction?.createdAt,
      description: transaction?.description || "",
    }));

    downloadCsv(rows, "transactions-export.csv");
  };

  /* =========================
     ACCOUNT DETAILS
  ========================= */

  const openAccountDialog = (account) => {
    setSelectedAccount(account);
    setAccountDialogOpen(true);
  };

  const closeAccountDialog = () => {
    setSelectedAccount(null);
    setAccountDialogOpen(false);
  };

  const getAccountId = (transaction) => {
    return (
      transaction?.accountId ??
      transaction?.account?.id ??
      null
    );
  };

  const selectedAccountTransactions = useMemo(() => {
    if (!selectedAccount) return [];

    return transactions
      .filter(
        (transaction) =>
          String(getAccountId(transaction)) ===
          String(selectedAccount?.id)
      )
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0) -
          new Date(a?.createdAt || 0)
      );
  }, [transactions, selectedAccount]);

  const exportAccountTransactions = () => {
    if (!selectedAccount) return;

    const rows = selectedAccountTransactions.map(
      (transaction) => ({
        id: transaction?.id,
        type: transaction?.type,
        amount: transaction?.amount,
        createdAt: transaction?.createdAt,
        description: transaction?.description || "",
      })
    );

    downloadCsv(
      rows,
      `account-${selectedAccount.id}-transactions.csv`
    );
  };

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 72px)",
          background: "#f8fafc",
          px: { xs: 2, sm: 3, lg: 4 },
          py: 4,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Skeleton
              variant="text"
              width={180}
              height={45}
            />
            <Skeleton
              variant="text"
              width={320}
              height={25}
            />
          </Box>

          <Skeleton
            variant="rounded"
            width="100%"
            height={190}
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
            width="100%"
            height={450}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        background: "#f8fafc",
        px: {
          xs: 2,
          sm: 3,
          lg: 4,
          xl: 5,
        },
        py: {
          xs: 2.5,
          sm: 3.5,
          lg: 4,
        },
      }}
    >
      {/* =========================
          PAGE HEADER
      ========================= */}

      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2,
          mb: 3.5,
          flexDirection: {
            xs: "column",
            md: "row",
          },
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: {
                xs: 26,
                sm: 30,
              },
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.7px",
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Monitor your banking operations and account activity.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={exportAllTransactions}
            disabled={!transactions.length}
            sx={{
              height: 42,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#dbe4f0",
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
              background: "#ffffff",
              border: "1px solid #dbe4f0",
              color: "#475569",
              "&:hover": {
                background: "#f8fafc",
              },
            }}
          >
            <RefreshIcon
              sx={{
                animation: refreshing
                  ? "dashboard-spin 1s linear infinite"
                  : "none",

                "@keyframes dashboard-spin": {
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
        </Stack>
      </Box>

      {refreshing && (
        <LinearProgress
          sx={{
            mb: 2,
            borderRadius: 10,
          }}
        />
      )}

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            alignItems: "center",
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

      {/* =========================
          HERO
      ========================= */}

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #dbe4f0",
          background:
            "linear-gradient(135deg, #0f3b82 0%, #1554b8 55%, #2563eb 100%)",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            right: -80,
            top: -120,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            right: 80,
            bottom: -120,
          }}
        />

        <CardContent
          sx={{
            p: {
              xs: 2.5,
              sm: 3,
              lg: 3.5,
            },
            position: "relative",
            zIndex: 1,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            spacing={3}
          >
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.2}
                mb={2}
              >
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor:
                      "rgba(255,255,255,0.16)",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {getInitials(user?.username)}
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color:
                        "rgba(255,255,255,0.72)",
                    }}
                  >
                    Welcome back
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {user?.username || "User"}
                  </Typography>
                </Box>
              </Stack>

              <Typography
                sx={{
                  fontSize: 12,
                  color:
                    "rgba(255,255,255,0.72)",
                  mb: 0.5,
                  letterSpacing: 0.5,
                }}
              >
                TOTAL BALANCE
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: 30,
                    sm: 36,
                  },
                  fontWeight: 800,
                  letterSpacing: "-1px",
                }}
              >
                {formatCurrency(totalBalance)}
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: 13,
                  color:
                    "rgba(255,255,255,0.72)",
                }}
              >
                Across {accounts.length} registered
                account
                {accounts.length !== 1 ? "s" : ""}
              </Typography>
            </Box>

            <Box
              sx={{
                minWidth: {
                  md: 210,
                },
                alignSelf: {
                  md: "flex-end",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color:
                    "rgba(255,255,255,0.68)",
                  mb: 1,
                }}
              >
                ACCOUNT OVERVIEW
              </Typography>

              <Stack spacing={0.8}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography fontSize={13}>
                    Accounts
                  </Typography>

                  <Typography
                    fontSize={13}
                    fontWeight={700}
                  >
                    {accounts.length}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography fontSize={13}>
                    Transactions
                  </Typography>

                  <Typography
                    fontSize={13}
                    fontWeight={700}
                  >
                    {totalTransactions}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontSize={13}>
                    Status
                  </Typography>

                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      height: 23,
                      color: "#dcfce7",
                      background:
                        "rgba(34,197,94,0.18)",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* =========================
          STATISTICS
      ========================= */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
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
          iconBackground="#eff6ff"
          iconColor="#2563eb"
        />

        <StatCard
          title="Total Accounts"
          value={accounts.length}
          subtitle="Active bank accounts"
          icon={
            <AccountBalanceWalletOutlinedIcon />
          }
          iconBackground="#ecfdf5"
          iconColor="#059669"
        />

        <StatCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          subtitle="Across all accounts"
          icon={<AccountBalanceOutlinedIcon />}
          iconBackground="#fff7ed"
          iconColor="#ea580c"
          largeValue
        />

        <StatCard
          title="Transactions"
          value={totalTransactions}
          subtitle="Recorded transactions"
          icon={<ReceiptLongOutlinedIcon />}
          iconBackground="#f5f3ff"
          iconColor="#7c3aed"
        />
      </Box>

      {/* =========================
          QUICK ACTIONS
      ========================= */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          mb: 3,
          background: "#ffffff",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              sm: 2.5,
              lg: 3,
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Quick Actions
          </Typography>

          <Typography
            sx={{
              mt: 0.3,
              mb: 2,
              color: "#64748b",
              fontSize: 13,
            }}
          >
            Start a banking operation
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 1.5,
            }}
          >
            <QuickAction
              label="Deposit Money"
              icon={<AddCircleIcon />}
              color="#059669"
              background="#ecfdf5"
              onClick={() => navigate("/deposit")}
            />

            <QuickAction
              label="Withdraw Money"
              icon={<RemoveCircleIcon />}
              color="#dc2626"
              background="#fef2f2"
              onClick={() => navigate("/withdraw")}
            />

            <QuickAction
              label="Transfer Funds"
              icon={<SwapHorizIcon />}
              color="#2563eb"
              background="#eff6ff"
              onClick={() => navigate("/transfer")}
            />
          </Box>
        </CardContent>
      </Card>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.5fr) minmax(360px, 0.9fr)",
          },
          gap: 2,
        }}
      >
        {/* =========================
            ACCOUNTS
        ========================= */}

        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <SectionHeader
            title="Your Accounts"
            subtitle="Overview of registered bank accounts"
            action="View all"
            onClick={() => navigate("/accounts")}
          />

          <Divider />

          {accounts.length === 0 ? (
            <EmptyState
              title="No accounts found"
              description="There are currently no bank accounts available."
            />
          ) : (
            accounts.slice(0, 6).map((account, index) => (
              <Box
                key={account?.id ?? index}
                sx={{
                  px: {
                    xs: 2,
                    sm: 2.5,
                    lg: 3,
                  },
                  py: 2.2,
                  borderBottom:
                    index !==
                    Math.min(accounts.length, 6) - 1
                      ? "1px solid #f1f5f9"
                      : "none",
                  transition:
                    "background 0.2s ease",
                  "&:hover": {
                    background: "#fafcff",
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
                  spacing={2}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    minWidth={0}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <AccountBalanceOutlinedIcon fontSize="small" />
                    </Box>

                    <Box minWidth={0}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0f172a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {account?.accountNumber ||
                          "Account number unavailable"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.3,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        {account?.customer?.name ||
                          "Customer unavailable"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.2,
                          fontSize: 11,
                          color: "#94a3b8",
                        }}
                      >
                        Account ID:{" "}
                        {account?.id ?? "N/A"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
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
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {formatCurrency(
                          account?.balance
                        )}
                      </Typography>

                      <Chip
                        label="Active"
                        size="small"
                        sx={{
                          mt: 0.6,
                          height: 22,
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#047857",
                          background: "#ecfdf5",
                          border:
                            "1px solid #a7f3d0",
                        }}
                      />
                    </Box>

                    <Button
                      variant="text"
                      size="small"
                      onClick={() =>
                        openAccountDialog(account)
                      }
                      sx={{
                        color: "#2563eb",
                        fontWeight: 800,
                        textTransform: "none",
                      }}
                    >
                      Details
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))
          )}
        </Card>

        {/* =========================
            TRANSACTIONS
        ========================= */}

        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <SectionHeader
            title="Recent Transactions"
            subtitle="Latest banking activity"
            action="View all"
            onClick={() => navigate("/transactions")}
          />

          <Divider />

          <Box
            sx={{
              px: {
                xs: 2,
                sm: 2.5,
              },
              py: 2,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.2}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search transactions..."
                value={txSearch}
                onChange={(event) => {
                  setTxSearch(event.target.value);
                  setTxPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          color: "#94a3b8",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                size="small"
                value={txType}
                onChange={(event) => {
                  setTxType(event.target.value);
                  setTxPage(1);
                }}
                sx={{
                  width: {
                    xs: "100%",
                    sm: 135,
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
            </Stack>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.2}
              sx={{
                mt: 1.2,
              }}
            >
              <TextField
                fullWidth
                label="From"
                type="date"
                size="small"
                value={txDateFrom}
                onChange={(event) => {
                  setTxDateFrom(event.target.value);
                  setTxPage(1);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                fullWidth
                label="To"
                type="date"
                size="small"
                value={txDateTo}
                onChange={(event) => {
                  setTxDateTo(event.target.value);
                  setTxPage(1);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {(txSearch ||
                txType !== "ALL" ||
                txDateFrom ||
                txDateTo) && (
                <Button
                  onClick={clearFilters}
                  sx={{
                    minWidth: {
                      xs: "100%",
                      sm: 80,
                    },
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Clear
                </Button>
              )}
            </Stack>
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
                  ? "Try changing your search or filters."
                  : "Recent banking activity will appear here."
              }
            />
          ) : (
            <>
              <Box>
                {pagedTransactions.map(
                  (transaction, index) => {
                    const type =
                      getTransactionType(
                        transaction
                      );

                    const transactionColor =
                      getTransactionColor(type);

                    return (
                      <Box
                        key={
                          transaction?.id ??
                          `transaction-${index}`
                        }
                        sx={{
                          px: {
                            xs: 2,
                            sm: 2.5,
                          },
                          py: 1.8,
                          borderBottom:
                            index !==
                            pagedTransactions.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.2}
                            minWidth={0}
                          >
                            <Box
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color:
                                  transactionColor,
                                background:
                                  getTransactionBackground(
                                    type
                                  ),
                              }}
                            >
                              {getTransactionIcon(
                                type
                              )}
                            </Box>

                            <Box minWidth={0}>
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {type}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.25,
                                  fontSize: 11,
                                  color: "#94a3b8",
                                  whiteSpace:
                                    "nowrap",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                  maxWidth: {
                                    xs: 120,
                                    sm: 180,
                                  },
                                }}
                              >
                                Transaction #
                                {transaction?.id ??
                                  "N/A"}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.15,
                                  fontSize: 10,
                                  color: "#94a3b8",
                                }}
                              >
                                {formatDate(
                                  transaction?.createdAt
                                )}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack
                            direction={{
                              xs: "column",
                              sm: "row",
                            }}
                            spacing={{
                              xs: 0.3,
                              sm: 1,
                            }}
                            alignItems={{
                              xs: "flex-end",
                              sm: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color:
                                  transactionColor,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatCurrency(
                                transaction?.amount
                              )}
                            </Typography>

                            <Button
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/transactions/${transaction?.id}`
                                )
                              }
                              sx={{
                                textTransform:
                                  "none",
                                fontWeight: 700,
                              }}
                            >
                              View
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  }
                )}
              </Box>

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
                    page={txPage}
                    onChange={(_, page) =>
                      setTxPage(page)
                    }
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Card>
      </Box>

      {/* =========================
          ACCOUNT DETAILS DIALOG
      ========================= */}

      <Dialog
        open={accountDialogOpen}
        onClose={closeAccountDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Account Details
        </DialogTitle>

        <DialogContent dividers>
          {!selectedAccount ? (
            <Typography>
              Account information unavailable.
            </Typography>
          ) : (
            <>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                mb={2}
              >
                <Avatar
                  sx={{
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                    fontWeight: 800,
                  }}
                >
                  {getInitials(
                    selectedAccount?.customer?.name
                  )}
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                    }}
                  >
                    {selectedAccount?.accountNumber ||
                      "Account"}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    {selectedAccount?.customer?.name ||
                      "Customer unavailable"}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 700,
                    textTransform:
                      "uppercase",
                  }}
                >
                  Current Balance
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: 25,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {formatCurrency(
                    selectedAccount?.balance
                  )}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  Account ID:{" "}
                  {selectedAccount?.id ?? "N/A"}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Recent Transactions
                </Typography>

                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  {selectedAccountTransactions.length}
                </Typography>
              </Stack>

              {selectedAccountTransactions.length ===
              0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                  }}
                >
                  <ReceiptLongOutlinedIcon
                    sx={{
                      color: "#cbd5e1",
                      fontSize: 34,
                    }}
                  />

                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    No transactions found for
                    this account.
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {selectedAccountTransactions
                    .slice(0, 10)
                    .map((transaction) => {
                      const type =
                        getTransactionType(
                          transaction
                        );

                      return (
                        <ListItem
                          key={transaction?.id}
                          disableGutters
                          sx={{
                            py: 1,
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color:
                                    getTransactionColor(
                                      type
                                    ),
                                }}
                              >
                                {type}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  sx={{
                                    display:
                                      "block",
                                    fontSize: 11,
                                  }}
                                >
                                  {transaction?.description ||
                                    `Transaction #${transaction?.id}`}
                                </Typography>

                                <Typography
                                  component="span"
                                  sx={{
                                    display:
                                      "block",
                                    mt: 0.2,
                                    fontSize: 10,
                                    color:
                                      "#94a3b8",
                                  }}
                                >
                                  {formatDate(
                                    transaction?.createdAt
                                  )}
                                </Typography>
                              </>
                            }
                          />

                          <Typography
                            sx={{
                              ml: 2,
                              fontSize: 13,
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
                        </ListItem>
                      );
                    })}
                </List>
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
            onClick={exportAccountTransactions}
            startIcon={<FileDownloadIcon />}
            disabled={
              !selectedAccountTransactions.length
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Export CSV
          </Button>

          <Button
            onClick={closeAccountDialog}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBackground,
  iconColor,
  largeValue = false,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        background: "#ffffff",
        height: "100%",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 8px 24px rgba(15,23,42,0.06)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
        >
          <Box minWidth={0}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontSize: largeValue ? 22 : 28,
                lineHeight: 1.1,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.2,
              background: iconBackground,
              color: iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================
   QUICK ACTION
========================= */

function QuickAction({
  label,
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
        minHeight: 64,
        px: 1.5,
        justifyContent: "flex-start",
        textTransform: "none",
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        color: "#1e293b",
        background: "#ffffff",
        "&:hover": {
          background,
          borderColor: color,
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          background,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mr: 1.5,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <ArrowForwardIcon
        sx={{
          ml: "auto",
          fontSize: 18,
          color: "#94a3b8",
        }}
      />
    </Button>
  );
}

/* =========================
   SECTION HEADER
========================= */

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
          xs: 2,
          sm: 2.5,
          lg: 3,
        },
        py: 2.2,
        display: "flex",
        alignItems: {
          xs: "flex-start",
          sm: "center",
        },
        justifyContent: "space-between",
        gap: 2,
        flexDirection: {
          xs: "column",
          sm: "row",
        },
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.3,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Button
        onClick={onClick}
        endIcon={<ArrowForwardIcon />}
        sx={{
          textTransform: "none",
          fontSize: 12,
          fontWeight: 800,
          color: "#2563eb",
          px: 0,
          minWidth: "auto",
          "&:hover": {
            background: "transparent",
            color: "#1d4ed8",
          },
        }}
      >
        {action}
      </Button>
    </Box>
  );
}

/* =========================
   EMPTY STATE
========================= */

function EmptyState({
  title,
  description,
}) {
  return (
    <Box
      sx={{
        px: 3,
        py: 6,
        textAlign: "center",
      }}
    >
      <ReceiptLongOutlinedIcon
        sx={{
          fontSize: 36,
          color: "#cbd5e1",
          mb: 1,
        }}
      />

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: "#475569",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: 12,
          color: "#94a3b8",
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

export default Dashboard;