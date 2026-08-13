import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import api from "../services/api";

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
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
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error("Dashboard loading failed:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce(
    (total, account) =>
      total + Number(account.balance || 0),
    0
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "success";

      case "WITHDRAW":
        return "error";

      case "TRANSFER":
        return "primary";

      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Stack
          spacing={2}
          alignItems="center"
        >
          <CircularProgress />

          <Typography color="text.secondary">
            Loading dashboard...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        minHeight: "calc(100vh - 64px)",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {/* Dashboard Header */}

      <Box mb={4}>
        <Typography
          variant="h4"
          fontWeight={700}
          color="#0f172a"
        >
          Bank Dashboard
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          mt={0.5}
        >
          Overview of your banking operations
        </Typography>
      </Box>

      {/* Error */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* =========================
          STATISTICS
          ========================= */}

      <Grid
        container
        spacing={3}
      >
        {/* Customers */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Customers
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={700}
                    mt={1}
                    color="#0f172a"
                  >
                    {customers.length}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Registered customers
                  </Typography>
                </Box>

                <Box
                  sx={{
                    backgroundColor: "#eff6ff",
                    borderRadius: 2,
                    p: 1.2,
                    fontSize: 24,
                  }}
                >
                  👥
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Accounts */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Accounts
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={700}
                    mt={1}
                    color="#0f172a"
                  >
                    {accounts.length}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Active bank accounts
                  </Typography>
                </Box>

                <Box
                  sx={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: 2,
                    p: 1.2,
                    fontSize: 24,
                  }}
                >
                  💳
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Balance */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Balance
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    mt={1}
                    color="#0f172a"
                  >
                    {formatCurrency(totalBalance)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Across all accounts
                  </Typography>
                </Box>

                <Box
                  sx={{
                    backgroundColor: "#fefce8",
                    borderRadius: 2,
                    p: 1.2,
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  ₹
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Transactions */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Transactions
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={700}
                    mt={1}
                    color="#0f172a"
                  >
                    {transactions.length}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Total transactions
                  </Typography>
                </Box>

                <Box
                  sx={{
                    backgroundColor: "#faf5ff",
                    borderRadius: 2,
                    p: 1.2,
                    fontSize: 24,
                  }}
                >
                  ↔
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =========================
          LOWER SECTION
          ========================= */}

      <Grid
        container
        spacing={3}
        mt={1}
      >
        {/* =========================
            ACCOUNTS
            ========================= */}

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box p={3}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="#0f172a"
                >
                  Accounts
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Customer account overview
                </Typography>
              </Box>

              <Divider />

              {accounts.length === 0 ? (
                <Box p={3}>
                  <Typography color="text.secondary">
                    No accounts found.
                  </Typography>
                </Box>
              ) : (
                accounts
                  .slice(0, 6)
                  .map((account) => (
                    <Box
                      key={account.id}
                      sx={{
                        px: 3,
                        py: 2.5,
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box>
                          <Typography
                            fontWeight={700}
                            color="#0f172a"
                          >
                            {account.accountNumber}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Account ID: {account.id}
                          </Typography>

                          <Typography
                            variant="body2"
                            mt={0.5}
                          >
                            {account.customer?.name ||
                              "Customer unavailable"}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {account.customer?.email ||
                              "Email unavailable"}
                          </Typography>
                        </Box>

                        <Box
                          textAlign={{
                            xs: "left",
                            sm: "right",
                          }}
                        >
                          <Typography
                            fontWeight={700}
                            color="#0f172a"
                          >
                            {formatCurrency(
                              account.balance
                            )}
                          </Typography>

                          <Chip
                            label="Active"
                            color="success"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Stack>
                    </Box>
                  ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* =========================
            TRANSACTIONS
            ========================= */}

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box p={3}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="#0f172a"
                >
                  Recent Transactions
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Latest banking activity
                </Typography>
              </Box>

              <Divider />

              {transactions.length === 0 ? (
                <Box p={3}>
                  <Typography color="text.secondary">
                    No transactions found.
                  </Typography>
                </Box>
              ) : (
                transactions
                  .slice(-5)
                  .reverse()
                  .map((transaction) => (
                    <Box
                      key={transaction.id}
                      sx={{
                        px: 3,
                        py: 2,
                        borderBottom:
                          "1px solid #f1f5f9",
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
                            fontWeight={600}
                            color="#0f172a"
                          >
                            {transaction.type}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Transaction #
                            {transaction.id}
                          </Typography>

                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {formatDate(
                              transaction.createdAt
                            )}
                          </Typography>
                        </Box>

                        <Chip
                          label={formatCurrency(
                            transaction.amount
                          )}
                          color={getTransactionColor(
                            transaction.type
                          )}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Box>
                  ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

