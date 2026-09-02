import { useEffect, useMemo, useState } from "react";

import {
  AccountBalanceWallet,
  ArrowDownward,
  ArrowUpward,
  CalendarMonth,
  CheckCircle,
  Close,
  Download,
  FilterAlt,
  History,
  Refresh,
  Search,
  SwapHoriz,
  TrendingUp,
  Visibility,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import api from "../services/api";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const TRANSACTION_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "DEPOSIT", label: "Deposits" },
  { value: "WITHDRAW", label: "Withdrawals" },
  { value: "TRANSFER", label: "Transfers" },
];

/*
 * Your current backend TransactionResponse does not contain
 * a transaction status.
 *
 * Therefore we should NOT show Pending/Failed filters.
 * Transactions returned by the backend are treated as
 * recorded/completed records in this UI.
 */
const TRANSACTION_STATUSES = [
  { value: "ALL", label: "All Records" },
  { value: "COMPLETED", label: "Recorded" },
];

/* =========================================================
   ROLE HELPER
========================================================= */

const getCurrentUserRole = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    const role =
      user?.role ||
      localStorage.getItem("role") ||
      "";

    return String(role)
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, "");
  } catch {
    const role = localStorage.getItem("role") || "";

    return String(role)
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, "");
  }
};

/* =========================================================
   TRANSACTION HELPERS
========================================================= */

const getTransactionType = (transaction) =>
  String(
    transaction?.type ||
      transaction?.transactionType ||
      ""
  ).toUpperCase();

const getTransactionStatus = (transaction) =>
  String(
    transaction?.status ||
      transaction?.transactionStatus ||
      "COMPLETED"
  ).toUpperCase();

const getTransactionId = (transaction) =>
  transaction?.transactionId ||
  transaction?.id ||
  transaction?.referenceNumber ||
  "N/A";

const getAmount = (transaction) =>
  Number(transaction?.amount || 0);

const getTimestamp = (transaction) =>
  transaction?.timestamp ||
  transaction?.createdAt ||
  transaction?.date ||
  transaction?.transactionDate ||
  null;

/* =========================================================
   ACCOUNT HELPERS
========================================================= */

const getFromAccountNumber = (transaction) =>
  transaction?.fromAccountNumber ||
  transaction?.fromAccount?.accountNumber ||
  null;

const getToAccountNumber = (transaction) =>
  transaction?.toAccountNumber ||
  transaction?.toAccount?.accountNumber ||
  null;

const getFromAccountId = (transaction) =>
  transaction?.fromAccountId ||
  transaction?.fromAccount?.id ||
  null;

const getToAccountId = (transaction) =>
  transaction?.toAccountId ||
  transaction?.toAccount?.id ||
  null;

const getAccountDisplay = (transaction) => {
  const from = getFromAccountNumber(transaction);
  const to = getToAccountNumber(transaction);

  if (from && to) {
    return `${from} → ${to}`;
  }

  if (from) {
    return from;
  }

  if (to) {
    return to;
  }

  if (transaction?.accountNumber) {
    return transaction.accountNumber;
  }

  if (typeof transaction?.account === "string") {
    return transaction.account;
  }

  if (transaction?.account?.accountNumber) {
    return transaction.account.accountNumber;
  }

  return "—";
};

const getAccountIdDisplay = (transaction) => {
  const from = getFromAccountId(transaction);
  const to = getToAccountId(transaction);

  if (from && to) {
    return `${from} → ${to}`;
  }

  return (
    from ||
    to ||
    transaction?.accountId ||
    "—"
  );
};

/* =========================================================
   FORMAT HELPERS
========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim();

const escapeCsv = (value) => {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
};

/* =========================================================
   TYPE CONFIG
========================================================= */

function getTypeConfig(type) {
  switch (String(type || "").toUpperCase()) {
    case "DEPOSIT":
      return {
        label: "Deposit",
        icon: <ArrowDownward fontSize="small" />,
        color: "success",
        className: "transaction-deposit",
      };

    case "WITHDRAW":
    case "WITHDRAWAL":
      return {
        label: "Withdrawal",
        icon: <ArrowUpward fontSize="small" />,
        color: "warning",
        className: "transaction-withdraw",
      };

    case "TRANSFER":
      return {
        label: "Transfer",
        icon: <SwapHoriz fontSize="small" />,
        color: "primary",
        className: "transaction-transfer",
      };

    default:
      return {
        label: type || "Unknown",
        icon: <History fontSize="small" />,
        color: "default",
        className: "transaction-default",
      };
  }
}

/* =========================================================
   STATUS CHIP
========================================================= */

function TransactionStatus({ status }) {
  const normalized = String(
    status || "COMPLETED"
  ).toUpperCase();

  return (
    <Chip
      size="small"
      icon={<CheckCircle fontSize="small" />}
      label={
        normalized === "COMPLETED"
          ? "Recorded"
          : normalized
      }
      color="success"
      variant="outlined"
      sx={{
        height: 28,
        borderRadius: "8px",
        fontWeight: 700,
        fontSize: "0.72rem",
        "& .MuiChip-icon": {
          fontSize: 15,
        },
      }}
    />
  );
}

/* =========================================================
   TYPE CHIP
========================================================= */

function TransactionTypeChip({ type }) {
  const config = getTypeConfig(type);

  return (
    <Chip
      size="small"
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="outlined"
      sx={{
        height: 30,
        borderRadius: "8px",
        fontWeight: 700,
        fontSize: "0.72rem",
        "& .MuiChip-icon": {
          fontSize: 16,
        },
      }}
    />
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  loading,
  accent,
}) {
  return (
    <Card className="metric-card">
      <CardContent className="metric-card-content">
        <Box className={`metric-icon ${accent}`}>
          {icon}
        </Box>

        <Box className="metric-content">
          <Typography className="metric-title">
            {title}
          </Typography>

          {loading ? (
            <Skeleton
              variant="text"
              width="75%"
              height={42}
            />
          ) : (
            <Typography className="metric-value">
              {value}
            </Typography>
          )}

          <Typography className="metric-subtitle">
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   LOADING TABLE
========================================================= */

function LoadingTable() {
  return (
    <TableBody>
      {Array.from({ length: 7 }).map(
        (_, index) => (
          <TableRow key={index}>
            {Array.from({ length: 7 }).map(
              (_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton
                    variant="rounded"
                    height={24}
                    width={
                      cellIndex === 0
                        ? "70%"
                        : "85%"
                    }
                  />
                </TableCell>
              )
            )}
          </TableRow>
        )
      )}
    </TableBody>
  );
}

/* =========================================================
   DETAIL DRAWER
========================================================= */

function TransactionDetails({
  transaction,
  onClose,
}) {
  if (!transaction) return null;

  const type = getTransactionType(transaction);
  const amount = getAmount(transaction);
  const timestamp = getTimestamp(transaction);

  const fromAccount =
    getFromAccountNumber(transaction);

  const toAccount =
    getToAccountNumber(transaction);

  const fromAccountId =
    getFromAccountId(transaction);

  const toAccountId =
    getToAccountId(transaction);

  return (
    <Drawer
      anchor="right"
      open={Boolean(transaction)}
      onClose={onClose}
      PaperProps={{
        className: "transaction-drawer",
      }}
    >
      <Box className="drawer-header">
        <Box>
          <Typography className="drawer-eyebrow">
            TRANSACTION DETAILS
          </Typography>

          <Typography className="drawer-title">
            {getTransactionId(transaction)}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          className="drawer-close"
        >
          <Close />
        </IconButton>
      </Box>

      <Box className="drawer-content">
        <Box className="detail-amount-card">
          <Box className="detail-amount-icon">
            <AccountBalanceWallet />
          </Box>

          <Typography className="detail-amount-label">
            Transaction Amount
          </Typography>

          <Typography className="detail-amount">
            {formatCurrency(amount)}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.5 }}
          >
            <TransactionTypeChip type={type} />

            <TransactionStatus
              status={getTransactionStatus(
                transaction
              )}
            />
          </Stack>
        </Box>

        <Typography className="section-title">
          Transaction information
        </Typography>

        <Box className="detail-grid">
          <DetailField
            label="Transaction ID"
            value={getTransactionId(transaction)}
          />

          <DetailField
            label="Transaction Type"
            value={getTypeConfig(type).label}
          />

          <DetailField
            label="Date"
            value={formatDate(timestamp)}
          />

          <DetailField
            label="Time"
            value={formatTime(timestamp)}
          />

          <DetailField
            label="Account"
            value={getAccountDisplay(transaction)}
          />

          <DetailField
            label="Account ID"
            value={getAccountIdDisplay(
              transaction
            )}
          />

          <DetailField
            label="Status"
            value={
              getTransactionStatus(
                transaction
              ) === "COMPLETED"
                ? "Recorded"
                : getTransactionStatus(
                    transaction
                  )
            }
          />
        </Box>

        {(fromAccount || toAccount) && (
          <>
            <Divider sx={{ my: 3 }} />

            <Typography className="section-title">
              Account information
            </Typography>

            <Box className="detail-grid">
              {fromAccount && (
                <DetailField
                  label="From Account"
                  value={fromAccount}
                />
              )}

              {toAccount && (
                <DetailField
                  label="To Account"
                  value={toAccount}
                />
              )}

              {fromAccountId && (
                <DetailField
                  label="From Account ID"
                  value={fromAccountId}
                />
              )}

              {toAccountId && (
                <DetailField
                  label="To Account ID"
                  value={toAccountId}
                />
              )}
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography className="section-title">
          Financial information
        </Typography>

        <Box className="financial-detail-card">
          <Box>
            <Typography className="financial-label">
              Amount processed
            </Typography>

            <Typography className="financial-value">
              {formatCurrency(amount)}
            </Typography>
          </Box>

          <Box className="financial-status">
            <CheckCircle />

            <Typography>
              Transaction recorded successfully
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

/* =========================================================
   DETAIL FIELD
========================================================= */

function DetailField({ label, value }) {
  return (
    <Box className="detail-field">
      <Typography className="detail-field-label">
        {label}
      </Typography>

      <Typography className="detail-field-value">
        {value || "—"}
      </Typography>
    </Box>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Transactions() {
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [dateFilter, setDateFilter] =
    useState("ALL");

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(PAGE_SIZE);

  const role = getCurrentUserRole();

  const isAdmin = role === "ADMIN";

  /* =======================================================
     LOAD TRANSACTIONS
  ======================================================= */

  const loadTransactions = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      /*
       * ADMIN:
       * GET /api/transactions
       *
       * USER:
       * GET /api/transactions/my
       */
      const currentRole =
        getCurrentUserRole();

      const endpoint =
        currentRole === "ADMIN"
          ? "/transactions"
          : "/transactions/my";

      console.log(
        "================================="
      );

      console.log(
        "Loading transactions"
      );

      console.log(
        "ROLE:",
        currentRole
      );

      console.log(
        "ENDPOINT:",
        endpoint
      );

      console.log(
        "================================="
      );

      const response =
        await api.get(endpoint);

      const data = Array.isArray(
        response?.data
      )
        ? response.data
        : [];

      setTransactions(data);
    } catch (err) {
      console.error(
        "Failed to load transactions:",
        err
      );

      console.error(
        "Transaction API response:",
        err?.response?.data
      );

      const status =
        err?.response?.status;

      if (status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else if (status === 403) {
        setError(
          "You do not have permission to view these transactions."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Unable to load transaction history. Please try again."
        );
      }

      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadTransactions(true);
  }, []);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    let total = 0;
    let deposits = 0;
    let withdrawals = 0;
    let transfers = 0;

    let depositCount = 0;
    let withdrawalCount = 0;
    let transferCount = 0;

    transactions.forEach(
      (transaction) => {
        const amount =
          getAmount(transaction);

        const type =
          getTransactionType(
            transaction
          );

        total += amount;

        if (type === "DEPOSIT") {
          deposits += amount;
          depositCount++;
        }

        if (
          type === "WITHDRAW" ||
          type === "WITHDRAWAL"
        ) {
          withdrawals += amount;
          withdrawalCount++;
        }

        if (type === "TRANSFER") {
          transfers += amount;
          transferCount++;
        }
      }
    );

    return {
      count: transactions.length,
      total,
      deposits,
      withdrawals,
      transfers,
      depositCount,
      withdrawalCount,
      transferCount,
    };
  }, [transactions]);

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredTransactions =
    useMemo(() => {
      const query =
        normalizeText(search);

      const now = new Date();

      return transactions.filter(
        (transaction) => {
          const type =
            getTransactionType(
              transaction
            );

          const status =
            getTransactionStatus(
              transaction
            );

          const timestamp =
            getTimestamp(transaction);

          /* ---------------------------------------------
             SEARCH
          --------------------------------------------- */

          if (query) {
            const searchableValues = [
              getTransactionId(
                transaction
              ),

              getAccountDisplay(
                transaction
              ),

              getAccountIdDisplay(
                transaction
              ),

              getFromAccountNumber(
                transaction
              ),

              getToAccountNumber(
                transaction
              ),

              getFromAccountId(
                transaction
              ),

              getToAccountId(
                transaction
              ),

              type,

              status,
            ];

            const matchesSearch =
              searchableValues.some(
                (value) =>
                  normalizeText(
                    value
                  ).includes(query)
              );

            if (!matchesSearch) {
              return false;
            }
          }

          /* ---------------------------------------------
             TYPE FILTER
          --------------------------------------------- */

          if (
            typeFilter !== "ALL" &&
            type !== typeFilter
          ) {
            return false;
          }

          /* ---------------------------------------------
             STATUS FILTER
          --------------------------------------------- */

          if (
            statusFilter !== "ALL" &&
            status !== statusFilter
          ) {
            return false;
          }

          /* ---------------------------------------------
             DATE FILTER
          --------------------------------------------- */

          if (
            dateFilter !== "ALL" &&
            timestamp
          ) {
            const date =
              new Date(timestamp);

            if (
              !Number.isNaN(
                date.getTime()
              )
            ) {
              const diff =
                now.getTime() -
                date.getTime();

              const days =
                diff /
                (1000 *
                  60 *
                  60 *
                  24);

              /*
               * Future transactions should not be
               * included in "Last N Days".
               */
              if (days < 0) {
                return false;
              }

              if (
                dateFilter === "7" &&
                days > 7
              ) {
                return false;
              }

              if (
                dateFilter === "30" &&
                days > 30
              ) {
                return false;
              }

              if (
                dateFilter === "90" &&
                days > 90
              ) {
                return false;
              }
            }
          }

          return true;
        }
      );
    }, [
      transactions,
      search,
      typeFilter,
      statusFilter,
      dateFilter,
    ]);

  /* =======================================================
     SORT
  ======================================================= */

  const sortedTransactions =
    useMemo(() => {
      return [
        ...filteredTransactions,
      ].sort((a, b) => {
        const dateA =
          new Date(
            getTimestamp(a) || 0
          ).getTime();

        const dateB =
          new Date(
            getTimestamp(b) || 0
          ).getTime();

        return dateB - dateA;
      });
    }, [filteredTransactions]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const paginatedTransactions =
    useMemo(() => {
      const start =
        page * rowsPerPage;

      return sortedTransactions.slice(
        start,
        start + rowsPerPage
      );
    }, [
      sortedTransactions,
      page,
      rowsPerPage,
    ]);

  /* =======================================================
     RESET PAGE
  ======================================================= */

  useEffect(() => {
    setPage(0);
  }, [
    search,
    typeFilter,
    statusFilter,
    dateFilter,
  ]);

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const handleExport = () => {
    if (!sortedTransactions.length) {
      return;
    }

    const headers = [
      "Transaction ID",
      "Type",
      "Amount",
      "Status",
      "From Account",
      "To Account",
      "From Account ID",
      "To Account ID",
      "Date",
      "Time",
    ];

    const rows =
      sortedTransactions.map(
        (transaction) => [
          getTransactionId(
            transaction
          ),

          getTypeConfig(
            getTransactionType(
              transaction
            )
          ).label,

          getAmount(transaction),

          getTransactionStatus(
            transaction
          ) === "COMPLETED"
            ? "Recorded"
            : getTransactionStatus(
                transaction
              ),

          getFromAccountNumber(
            transaction
          ) || "—",

          getToAccountNumber(
            transaction
          ) || "—",

          getFromAccountId(
            transaction
          ) || "—",

          getToAccountId(
            transaction
          ) || "—",

          formatDate(
            getTimestamp(
              transaction
            )
          ),

          formatTime(
            getTimestamp(
              transaction
            )
          ),
        ]
      );

    const csv = [
      headers
        .map(escapeCsv)
        .join(","),

      ...rows.map((row) =>
        row
          .map(escapeCsv)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setDateFilter("ALL");
    setPage(0);
  };

  const hasFilters =
    Boolean(search) ||
    typeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    dateFilter !== "ALL";

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <Box className="transactions-page">
      <style>
        {`
          .transactions-page {
            min-height: 100vh;
            background:
              radial-gradient(
                circle at top right,
                rgba(37, 99, 235, 0.045),
                transparent 28%
              ),
              #f6f8fc;
            padding: 28px;
            color: #172033;
          }

          .transactions-container {
            max-width: 1600px;
            margin: 0 auto;
          }

          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 26px;
          }

          .page-header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .page-header-icon {
            width: 54px;
            height: 54px;
            border-radius: 15px;
            background: linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              0 10px 24px rgba(37, 99, 235, 0.20);
          }

          .page-title {
            font-size: 28px !important;
            font-weight: 800 !important;
            letter-spacing: -0.035em !important;
            color: #172033;
          }

          .page-subtitle {
            margin-top: 4px !important;
            color: #667085;
            font-size: 14px !important;
          }

          .header-actions {
            display: flex;
            gap: 10px;
          }

          .header-button {
            min-height: 42px !important;
            border-radius: 10px !important;
            text-transform: none !important;
            font-weight: 700 !important;
            box-shadow: none !important;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
          }

          .metric-card {
            border: 1px solid #e7ebf2 !important;
            border-radius: 14px !important;
            box-shadow:
              0 3px 14px rgba(16, 24, 40, 0.045) !important;
            background: #ffffff !important;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 10px 28px rgba(16, 24, 40, 0.08) !important;
          }

          .metric-card-content {
            padding: 20px !important;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }

          .metric-icon {
            width: 44px;
            height: 44px;
            min-width: 44px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .metric-icon.blue {
            background: #eff6ff;
            color: #2563eb;
          }

          .metric-icon.green {
            background: #ecfdf3;
            color: #16a34a;
          }

          .metric-icon.orange {
            background: #fff7ed;
            color: #ea580c;
          }

          .metric-icon.purple {
            background: #f5f3ff;
            color: #7c3aed;
          }

          .metric-content {
            min-width: 0;
          }

          .metric-title {
            color: #667085 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            text-transform: uppercase;
            letter-spacing: 0.045em;
          }

          .metric-value {
            margin-top: 4px !important;
            color: #172033;
            font-size: 24px !important;
            line-height: 1.2 !important;
            font-weight: 800 !important;
            letter-spacing: -0.025em;
          }

          .metric-subtitle {
            margin-top: 4px !important;
            color: #98a2b3;
            font-size: 12px !important;
          }

          .transactions-card {
            border: 1px solid #e5e9f0 !important;
            border-radius: 16px !important;
            overflow: hidden;
            box-shadow:
              0 4px 20px rgba(16, 24, 40, 0.055) !important;
            background: #ffffff !important;
          }

          .toolbar {
            padding: 18px;
            border-bottom: 1px solid #eaecf0;
            background: #ffffff;
          }

          .toolbar-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 15px;
          }

          .toolbar-title {
            font-size: 17px !important;
            font-weight: 800 !important;
            color: #172033;
          }

          .toolbar-description {
            margin-top: 3px !important;
            font-size: 12px !important;
            color: #98a2b3;
          }

          .filter-row {
            display: grid;
            grid-template-columns:
              minmax(260px, 1.8fr)
              repeat(3, minmax(150px, 0.7fr))
              auto;
            gap: 10px;
            align-items: center;
          }

          .filter-control .MuiOutlinedInput-root {
            border-radius: 9px;
            background: #fbfcfe;
            min-height: 42px;
          }

          .filter-control .MuiOutlinedInput-notchedOutline {
            border-color: #dfe4ec;
          }

          .filter-control:hover
          .MuiOutlinedInput-notchedOutline {
            border-color: #b8c2d1;
          }

          .filter-control
          .Mui-focused
          .MuiOutlinedInput-notchedOutline {
            border-color: #2563eb;
            border-width: 1px;
          }

          .clear-button {
            min-height: 42px !important;
            border-radius: 9px !important;
            text-transform: none !important;
            font-weight: 700 !important;
          }

          .table-wrapper {
            width: 100%;
            overflow-x: auto;
          }

          .transaction-table {
            min-width: 1050px;
          }

          .transaction-table
          .MuiTableHead-root {
            background: #f8fafc;
          }

          .transaction-table
          .MuiTableCell-head {
            padding: 13px 18px;
            border-bottom: 1px solid #e5e7eb;
            color: #667085;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.045em;
            white-space: nowrap;
          }

          .transaction-table
          .MuiTableCell-body {
            padding: 15px 18px;
            border-bottom: 1px solid #f0f2f5;
            vertical-align: middle;
          }

          .transaction-row {
            transition: background 0.15s ease;
          }

          .transaction-row:hover {
            background: #fafcff;
          }

          .transaction-id {
            font-weight: 800 !important;
            color: #172033 !important;
            font-size: 13px !important;
          }

          .transaction-date {
            font-size: 13px !important;
            color: #344054 !important;
            font-weight: 600 !important;
          }

          .transaction-time {
            font-size: 11px !important;
            color: #98a2b3 !important;
            margin-top: 2px !important;
          }

          .account-number {
            font-family:
              "SFMono-Regular",
              Consolas,
              "Liberation Mono",
              monospace !important;
            font-size: 12px !important;
            color: #344054 !important;
            font-weight: 700 !important;
            white-space: nowrap;
          }

          .amount {
            font-size: 14px !important;
            font-weight: 800 !important;
            white-space: nowrap;
          }

          .amount.deposit {
            color: #15803d !important;
          }

          .amount.withdraw {
            color: #c2410c !important;
          }

          .amount.transfer {
            color: #2563eb !important;
          }

          .action-button {
            width: 34px !important;
            height: 34px !important;
            border-radius: 8px !important;
            color: #667085 !important;
          }

          .action-button:hover {
            background: #eff6ff !important;
            color: #2563eb !important;
          }

          .empty-state {
            padding: 70px 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .empty-icon {
            width: 58px;
            height: 58px;
            border-radius: 16px;
            margin: 0 auto 14px;
            background: #f2f4f7;
            color: #98a2b3;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .empty-title {
            font-size: 16px !important;
            font-weight: 800 !important;
            color: #344054;
          }

          .empty-description {
            margin-top: 5px !important;
            font-size: 13px !important;
            color: #98a2b3;
          }

          .pagination-bar {
            min-height: 58px;
            border-top: 1px solid #eaecf0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 14px 0 18px;
            background: #ffffff;
          }

          .result-count {
            color: #667085 !important;
            font-size: 12px !important;
            font-weight: 600 !important;
          }

          .transaction-drawer {
            width: 450px;
            max-width: 100vw;
            background: #f8fafc !important;
          }

          .drawer-header {
            height: 76px;
            padding: 0 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
          }

          .drawer-eyebrow {
            color: #667085 !important;
            font-size: 10px !important;
            font-weight: 800 !important;
            letter-spacing: 0.08em;
          }

          .drawer-title {
            margin-top: 2px !important;
            color: #172033 !important;
            font-size: 16px !important;
            font-weight: 800 !important;
          }

          .drawer-close {
            border: 1px solid #e4e7ec !important;
            border-radius: 9px !important;
          }

          .drawer-content {
            padding: 20px;
          }

          .detail-amount-card {
            padding: 24px 20px;
            border-radius: 15px;
            background: linear-gradient(
              145deg,
              #eff6ff,
              #f8fbff
            );
            border: 1px solid #dbeafe;
            text-align: center;
          }

          .detail-amount-icon {
            width: 46px;
            height: 46px;
            border-radius: 13px;
            margin: 0 auto 10px;
            background: #ffffff;
            color: #2563eb;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              0 4px 12px rgba(37, 99, 235, 0.08);
          }

          .detail-amount-label {
            color: #667085 !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .detail-amount {
            margin-top: 4px !important;
            color: #172033 !important;
            font-size: 30px !important;
            font-weight: 900 !important;
            letter-spacing: -0.04em;
          }

          .section-title {
            margin: 24px 0 12px !important;
            color: #344054 !important;
            font-size: 13px !important;
            font-weight: 800 !important;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .detail-field {
            padding: 13px;
            border: 1px solid #eaecf0;
            border-radius: 10px;
            background: #ffffff;
            min-width: 0;
          }

          .detail-field-label {
            color: #98a2b3 !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            text-transform: uppercase;
            letter-spacing: 0.035em;
          }

          .detail-field-value {
            margin-top: 4px !important;
            color: #344054 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            overflow-wrap: anywhere;
          }

          .financial-detail-card {
            padding: 17px;
            background: #ffffff;
            border: 1px solid #eaecf0;
            border-radius: 11px;
          }

          .financial-label {
            color: #98a2b3 !important;
            font-size: 11px !important;
          }

          .financial-value {
            margin-top: 3px !important;
            color: #172033 !important;
            font-size: 20px !important;
            font-weight: 800 !important;
          }

          .financial-status {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            color: #15803d;
            font-size: 12px;
            font-weight: 700;
          }

          .financial-status svg {
            font-size: 17px;
          }

          @media (max-width: 1200px) {
            .metrics-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .filter-row {
              grid-template-columns:
                1fr 1fr;
            }

            .filter-row
            > *:first-child {
              grid-column: span 2;
            }
          }

          @media (max-width: 768px) {
            .transactions-page {
              padding: 16px;
            }

            .page-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .header-actions {
              width: 100%;
            }

            .header-button {
              flex: 1;
            }

            .page-title {
              font-size: 23px !important;
            }

            .metrics-grid {
              grid-template-columns: 1fr;
            }

            .filter-row {
              grid-template-columns: 1fr;
            }

            .filter-row
            > *:first-child {
              grid-column: auto;
            }

            .toolbar {
              padding: 14px;
            }

            .toolbar-top {
              align-items: flex-start;
              flex-direction: column;
            }

            .pagination-bar {
              min-height: auto;
              padding: 8px;
              display: block;
            }

            .result-count {
              display: none;
            }

            .transaction-drawer {
              width: 100%;
            }

            .detail-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 480px) {
            .page-header-left {
              align-items: flex-start;
            }

            .page-header-icon {
              width: 46px;
              height: 46px;
              min-width: 46px;
            }

            .header-actions {
              flex-direction: column;
            }

            .metric-card-content {
              padding: 16px !important;
            }

            .metric-value {
              font-size: 22px !important;
            }
          }
        `}
      </style>

      <Box className="transactions-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <Box className="page-header">
          <Box className="page-header-left">
            <Box className="page-header-icon">
              <History />
            </Box>

            <Box>
              <Typography className="page-title">
                Transactions
              </Typography>

              <Typography className="page-subtitle">
                {isAdmin
                  ? "Monitor, search and review all banking transactions"
                  : "Monitor, search and review your transaction history"}
              </Typography>
            </Box>
          </Box>

          <Box className="header-actions">
            <Tooltip title="Refresh transactions">
              <span>
                <Button
                  className="header-button"
                  variant="outlined"
                  startIcon={
                    refreshing ? (
                      <CircularProgress
                        size={17}
                      />
                    ) : (
                      <Refresh />
                    )
                  }
                  onClick={() =>
                    loadTransactions(false)
                  }
                  disabled={refreshing}
                >
                  Refresh
                </Button>
              </span>
            </Tooltip>

            <Button
              className="header-button"
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={
                loading ||
                sortedTransactions.length === 0
              }
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: 2,
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* =================================================
            KPI
        ================================================= */}

        <Box className="metrics-grid">
          <MetricCard
            title="Total Transactions"
            value={statistics.count.toLocaleString(
              "en-IN"
            )}
            subtitle={
              isAdmin
                ? "All recorded transactions"
                : "Your recorded transactions"
            }
            icon={<History />}
            loading={loading}
            accent="blue"
          />

          <MetricCard
            title="Transaction Volume"
            value={formatCompactCurrency(
              statistics.total
            )}
            subtitle="Total processed value"
            icon={<TrendingUp />}
            loading={loading}
            accent="green"
          />

          <MetricCard
            title="Deposits"
            value={formatCompactCurrency(
              statistics.deposits
            )}
            subtitle={`${statistics.depositCount} deposit transaction${
              statistics.depositCount !== 1
                ? "s"
                : ""
            }`}
            icon={<ArrowDownward />}
            loading={loading}
            accent="purple"
          />

          <MetricCard
            title="Withdrawals"
            value={formatCompactCurrency(
              statistics.withdrawals
            )}
            subtitle={`${statistics.withdrawalCount} withdrawal transaction${
              statistics.withdrawalCount !== 1
                ? "s"
                : ""
            }`}
            icon={<ArrowUpward />}
            loading={loading}
            accent="orange"
          />
        </Box>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <Card className="transactions-card">
          <Box className="toolbar">

            <Box className="toolbar-top">
              <Box>
                <Typography className="toolbar-title">
                  Transaction history
                </Typography>

                <Typography className="toolbar-description">
                  {filteredTransactions.length}{" "}
                  transaction
                  {filteredTransactions.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  matching your filters
                </Typography>
              </Box>

              {hasFilters && (
                <Button
                  className="clear-button"
                  variant="text"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </Box>

            <Box className="filter-row">

              {/* SEARCH */}

              <TextField
                className="filter-control"
                size="small"
                fullWidth
                placeholder="Search transaction ID, account..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search
                        fontSize="small"
                        sx={{
                          color: "#98a2b3",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              {/* TYPE */}

              <FormControl
                className="filter-control"
                size="small"
                fullWidth
              >
                <InputLabel>
                  Transaction Type
                </InputLabel>

                <Select
                  value={typeFilter}
                  label="Transaction Type"
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                >
                  {TRANSACTION_TYPES.map(
                    (item) => (
                      <MenuItem
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              {/* STATUS */}

              <FormControl
                className="filter-control"
                size="small"
                fullWidth
              >
                <InputLabel>
                  Status
                </InputLabel>

                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  {TRANSACTION_STATUSES.map(
                    (item) => (
                      <MenuItem
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              {/* DATE */}

              <FormControl
                className="filter-control"
                size="small"
                fullWidth
              >
                <InputLabel>
                  Date Range
                </InputLabel>

                <Select
                  value={dateFilter}
                  label="Date Range"
                  onChange={(event) =>
                    setDateFilter(
                      event.target.value
                    )
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="ALL">
                    All Time
                  </MenuItem>

                  <MenuItem value="7">
                    Last 7 Days
                  </MenuItem>

                  <MenuItem value="30">
                    Last 30 Days
                  </MenuItem>

                  <MenuItem value="90">
                    Last 90 Days
                  </MenuItem>
                </Select>
              </FormControl>

              <Tooltip title="Filters active">
                <IconButton
                  sx={{
                    width: 42,
                    height: 42,
                    border:
                      "1px solid #dfe4ec",
                    borderRadius: "9px",
                    color: hasFilters
                      ? "#2563eb"
                      : "#667085",
                    bgcolor: hasFilters
                      ? "#eff6ff"
                      : "#fbfcfe",
                  }}
                >
                  <FilterAlt fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* =================================================
              TABLE
          ================================================= */}

          <Box className="table-wrapper">
            <Table
              className="transaction-table"
              stickyHeader
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    Transaction
                  </TableCell>

                  <TableCell>
                    Date & Time
                  </TableCell>

                  <TableCell>
                    Account
                  </TableCell>

                  <TableCell>
                    Account ID
                  </TableCell>

                  <TableCell>
                    Type
                  </TableCell>

                  <TableCell align="right">
                    Amount
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              {/* LOADING */}

              {loading ? (
                <LoadingTable />
              ) : paginatedTransactions.length ===
                0 ? (

                /* EMPTY */

                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      sx={{
                        borderBottom:
                          "none",
                      }}
                    >
                      <Box className="empty-state">
                        <Box>
                          <Box className="empty-icon">
                            {hasFilters ? (
                              <Search />
                            ) : (
                              <History />
                            )}
                          </Box>

                          <Typography className="empty-title">
                            {hasFilters
                              ? "No matching transactions"
                              : "No transactions found"}
                          </Typography>

                          <Typography className="empty-description">
                            {hasFilters
                              ? "Try changing your search or filters."
                              : "Transaction records will appear here."}
                          </Typography>

                          {hasFilters && (
                            <Button
                              sx={{
                                mt: 2,
                                textTransform:
                                  "none",
                                fontWeight: 700,
                              }}
                              onClick={
                                clearFilters
                              }
                            >
                              Clear filters
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>

              ) : (

                /* DATA */

                <TableBody>
                  {paginatedTransactions.map(
                    (
                      transaction,
                      index
                    ) => {
                      const type =
                        getTransactionType(
                          transaction
                        );

                      const timestamp =
                        getTimestamp(
                          transaction
                        );

                      const amount =
                        getAmount(
                          transaction
                        );

                      const rowKey =
                        getTransactionId(
                          transaction
                        ) !== "N/A"
                          ? getTransactionId(
                              transaction
                            )
                          : `transaction-${index}`;

                      return (
                        <TableRow
                          key={rowKey}
                          className="transaction-row"
                        >
                          {/* TRANSACTION */}

                          <TableCell>
                            <Typography className="transaction-id">
                              {getTransactionId(
                                transaction
                              )}
                            </Typography>
                          </TableCell>

                          {/* DATE */}

                          <TableCell>
                            <Typography className="transaction-date">
                              {formatDate(
                                timestamp
                              )}
                            </Typography>

                            <Typography className="transaction-time">
                              {formatTime(
                                timestamp
                              )}
                            </Typography>
                          </TableCell>

                          {/* ACCOUNT */}

                          <TableCell>
                            <Typography className="account-number">
                              {getAccountDisplay(
                                transaction
                              )}
                            </Typography>
                          </TableCell>

                          {/* ACCOUNT ID */}

                          <TableCell>
                            <Typography className="account-number">
                              {getAccountIdDisplay(
                                transaction
                              )}
                            </Typography>
                          </TableCell>

                          {/* TYPE */}

                          <TableCell>
                            <TransactionTypeChip
                              type={type}
                            />
                          </TableCell>

                          {/* AMOUNT */}

                          <TableCell align="right">
                            <Typography
                              className={`amount ${
                                type ===
                                "DEPOSIT"
                                  ? "deposit"
                                  : type ===
                                      "WITHDRAW" ||
                                    type ===
                                      "WITHDRAWAL"
                                  ? "withdraw"
                                  : "transfer"
                              }`}
                            >
                              {type ===
                                "DEPOSIT" &&
                                "+"}

                              {(type ===
                                "WITHDRAW" ||
                                type ===
                                  "WITHDRAWAL") &&
                                "-"}

                              {formatCurrency(
                                amount
                              )}
                            </Typography>
                          </TableCell>

                          {/* STATUS */}

                          <TableCell>
                            <TransactionStatus
                              status={getTransactionStatus(
                                transaction
                              )}
                            />
                          </TableCell>

                          {/* ACTION */}

                          <TableCell align="center">
                            <Tooltip title="View details">
                              <IconButton
                                className="action-button"
                                onClick={() =>
                                  setSelectedTransaction(
                                    transaction
                                  )
                                }
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              )}
            </Table>
          </Box>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            sortedTransactions.length >
              0 && (
              <Box className="pagination-bar">
                <Typography className="result-count">
                  Showing{" "}
                  {page *
                    rowsPerPage +
                    1}
                  –
                  {Math.min(
                    (page + 1) *
                      rowsPerPage,
                    sortedTransactions.length
                  )}{" "}
                  of{" "}
                  {
                    sortedTransactions.length
                  }{" "}
                  transactions
                </Typography>

                <TablePagination
                  component="div"
                  count={
                    sortedTransactions.length
                  }
                  page={page}
                  onPageChange={(
                    _,
                    newPage
                  ) =>
                    setPage(newPage)
                  }
                  rowsPerPage={
                    rowsPerPage
                  }
                  onRowsPerPageChange={(
                    event
                  ) => {
                    setRowsPerPage(
                      Number(
                        event.target
                          .value
                      )
                    );

                    setPage(0);
                  }}
                  rowsPerPageOptions={[
                    10,
                    25,
                    50,
                  ]}
                  labelRowsPerPage="Rows:"
                  showFirstButton={false}
                  showLastButton={false}
                  slotProps={{
                    select: {
                      size: "small",
                    },
                  }}
                />
              </Box>
            )}
        </Card>

        {/* =================================================
            DETAILS DRAWER
        ================================================= */}

        <TransactionDetails
          transaction={
            selectedTransaction
          }
          onClose={() =>
            setSelectedTransaction(
              null
            )
          }
        />
      </Box>
    </Box>
  );
}

export default Transactions;