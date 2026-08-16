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
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";

import api from "../services/api";

const PAGE_SIZE = 6;

function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* =========================
     LOAD CUSTOMERS
  ========================= */

  const loadCustomers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/customers");

      setCustomers(
        Array.isArray(response?.data) ? response.data : []
      );
    } catch (err) {
      console.error("Customers loading failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load customers. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  /* =========================
     HELPERS
  ========================= */

  const getCustomerName = (customer) => {
    return (
      customer?.name ||
      customer?.fullName ||
      customer?.customerName ||
      "Unknown Customer"
    );
  };

  const getCustomerEmail = (customer) => {
    return (
      customer?.email ||
      customer?.emailAddress ||
      "Email unavailable"
    );
  };

  const getCustomerPhone = (customer) => {
    return (
      customer?.phone ||
      customer?.phoneNumber ||
      customer?.mobile ||
      "Phone unavailable"
    );
  };

  const getCustomerId = (customer) => {
    return (
      customer?.id ??
      customer?.customerId ??
      "N/A"
    );
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

  /* =========================
     FILTERING
  ========================= */

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const values = [
        getCustomerId(customer),
        getCustomerName(customer),
        getCustomerEmail(customer),
        getCustomerPhone(customer),
        customer?.address,
        customer?.city,
        customer?.accountNumber,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [customers, search]);

  /* =========================
     PAGINATION
  ========================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredCustomers.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredCustomers, page]);

  /* =========================
     CUSTOMER DETAILS
  ========================= */

  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const closeCustomerDetails = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
  };

  /* =========================
     DELETE CUSTOMER
  ========================= */

  const openDeleteDialog = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;

    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const deleteCustomer = async () => {
    if (!customerToDelete) return;

    const customerId = getCustomerId(customerToDelete);

    if (customerId === "N/A") {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/customers/${customerId}`);

      setCustomers((previous) =>
        previous.filter(
          (customer) =>
            String(getCustomerId(customer)) !==
            String(customerId)
        )
      );

      setDeleteDialogOpen(false);
      setCustomerToDelete(null);

      if (selectedCustomer) {
        setDialogOpen(false);
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error("Customer deletion failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to delete customer. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =========================
     CLEAR SEARCH
  ========================= */

  const clearSearch = () => {
    setSearch("");
    setPage(1);
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
              width={210}
              height={45}
            />

            <Skeleton
              variant="text"
              width={380}
              height={25}
            />
          </Box>

          <Skeleton
            variant="rounded"
            height={120}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton
                key={item}
                variant="rounded"
                height={210}
              />
            ))}
          </Box>
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
            Customers
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Manage and monitor your registered bank customers.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1Icon />}
            onClick={() => navigate("/customers/add")}
            sx={{
              height: 42,
              px: 2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              boxShadow: "none",
            }}
          >
            Add Customer
          </Button>

          <IconButton
            onClick={() => loadCustomers(true)}
            disabled={refreshing}
            aria-label="Refresh customers"
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
                  ? "customer-spin 1s linear infinite"
                  : "none",
                "@keyframes customer-spin": {
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
              onClick={() => loadCustomers()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* =========================
          SUMMARY
      ========================= */}

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
        <SummaryCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered customers"
          icon={<PeopleIcon />}
          iconBackground="#eff6ff"
          iconColor="#2563eb"
        />

        <SummaryCard
          title="Showing"
          value={filteredCustomers.length}
          subtitle={
            search
              ? "Customers matching your search"
              : "Customers available"
          }
          icon={<BadgeOutlinedIcon />}
          iconBackground="#ecfdf5"
          iconColor="#059669"
        />

        <SummaryCard
          title="Current Page"
          value={`${page} / ${totalPages}`}
          subtitle="Customer list pagination"
          icon={<AccountBalanceOutlinedIcon />}
          iconBackground="#f5f3ff"
          iconColor="#7c3aed"
        />
      </Box>

      {/* =========================
          CUSTOMER LIST CARD
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
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Customer Directory
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              Search and manage customer information.
            </Typography>
          </Box>

          <Chip
            icon={<PeopleIcon />}
            label={`${customers.length} customers`}
            sx={{
              height: 30,
              background: "#eff6ff",
              color: "#2563eb",
              fontWeight: 800,
              fontSize: 11,
              "& .MuiChip-icon": {
                color: "#2563eb",
                fontSize: 17,
              },
            }}
          />
        </Box>

        <Divider />

        {/* =========================
            SEARCH
        ========================= */}

        <Box
          sx={{
            px: {
              xs: 2,
              sm: 2.5,
              lg: 3,
            },
            py: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, phone or customer ID..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
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
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                background: "#f8fafc",
              },
            }}
          />
        </Box>

        <Divider />

        {/* =========================
            EMPTY STATE
        ========================= */}

        {filteredCustomers.length === 0 ? (
          <CustomerEmptyState
            hasCustomers={customers.length > 0}
            onClear={clearSearch}
            onAdd={() => navigate("/customers/add")}
          />
        ) : (
          <>
            {/* =========================
                CUSTOMER GRID
            ========================= */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                  lg: 2.5,
                },
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  xl: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {paginatedCustomers.map(
                (customer, index) => (
                  <CustomerCard
                    key={
                      getCustomerId(customer) !== "N/A"
                        ? getCustomerId(customer)
                        : index
                    }
                    customer={customer}
                    onView={() =>
                      openCustomerDetails(customer)
                    }
                    onEdit={() =>
                      navigate(
                        `/customers/edit/${getCustomerId(
                          customer
                        )}`
                      )
                    }
                    onDelete={() =>
                      openDeleteDialog(customer)
                    }
                  />
                )
              )}
            </Box>

            {/* =========================
                PAGINATION
            ========================= */}

            {totalPages > 1 && (
              <>
                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 2.2,
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) =>
                      setPage(newPage)
                    }
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </>
        )}
      </Card>

      {/* =========================
          CUSTOMER DETAILS DIALOG
      ========================= */}

      <Dialog
        open={dialogOpen}
        onClose={closeCustomerDetails}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#0f172a",
            pr: 6,
          }}
        >
          Customer Details

          <IconButton
            onClick={closeCustomerDetails}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "#64748b",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!selectedCustomer ? (
            <Typography>
              Customer information unavailable.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {getInitials(
                    getCustomerName(selectedCustomer)
                  )}
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {getCustomerName(
                      selectedCustomer
                    )}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    Customer ID:{" "}
                    {getCustomerId(selectedCustomer)}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <DetailRow
                icon={<EmailOutlinedIcon />}
                label="Email"
                value={getCustomerEmail(
                  selectedCustomer
                )}
              />

              <DetailRow
                icon={<PhoneOutlinedIcon />}
                label="Phone"
                value={getCustomerPhone(
                  selectedCustomer
                )}
              />

              <DetailRow
                icon={<BadgeOutlinedIcon />}
                label="Customer ID"
                value={String(
                  getCustomerId(selectedCustomer)
                )}
              />

              {selectedCustomer?.address && (
                <DetailRow
                  icon={<AccountBalanceOutlinedIcon />}
                  label="Address"
                  value={selectedCustomer.address}
                />
              )}

              {selectedCustomer?.city && (
                <DetailRow
                  icon={<AccountBalanceOutlinedIcon />}
                  label="City"
                  value={selectedCustomer.city}
                />
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
          }}
        >
          <Button
            onClick={() => {
              if (!selectedCustomer) return;

              navigate(
                `/customers/edit/${getCustomerId(
                  selectedCustomer
                )}`
              );
            }}
            startIcon={<EditOutlinedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Edit
          </Button>

          <Button
            onClick={closeCustomerDetails}
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

      {/* =========================
          DELETE DIALOG
      ========================= */}

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Delete Customer
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#475569",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to delete{" "}
            <strong>
              {customerToDelete
                ? getCustomerName(customerToDelete)
                : "this customer"}
            </strong>
            ?
          </Typography>

          <Alert
            severity="warning"
            sx={{
              mt: 2,
              borderRadius: 2,
              fontSize: 12,
            }}
          >
            This action cannot be undone.
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
          }}
        >
          <Button
            onClick={closeDeleteDialog}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={deleteCustomer}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {deleting ? "Deleting..." : "Delete Customer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* =========================
   SUMMARY CARD
========================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBackground,
  iconColor,
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
                fontSize: 27,
                lineHeight: 1.1,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
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
   CUSTOMER CARD
========================= */

function CustomerCard({
  customer,
  onView,
  onEdit,
  onDelete,
}) {
  const name =
    customer?.name ||
    customer?.fullName ||
    customer?.customerName ||
    "Unknown Customer";

  const email =
    customer?.email ||
    customer?.emailAddress ||
    "Email unavailable";

  const phone =
    customer?.phone ||
    customer?.phoneNumber ||
    customer?.mobile ||
    "Phone unavailable";

  const id =
    customer?.id ??
    customer?.customerId ??
    "N/A";

  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 2.5,
        background: "#ffffff",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "#cbd5e1",
          boxShadow:
            "0 8px 24px rgba(15,23,42,0.06)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.2,
        }}
      >
        <Stack spacing={2}>
          {/* Customer heading */}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.4}
              minWidth={0}
            >
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "#eff6ff",
                  color: "#2563eb",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {initials || "U"}
              </Avatar>

              <Box minWidth={0}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  ID: {id}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label="Active"
              size="small"
              sx={{
                height: 23,
                color: "#047857",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0,
              }}
            />
          </Stack>

          <Divider />

          {/* Customer information */}

          <Stack spacing={1.1}>
            <InfoLine
              icon={<EmailOutlinedIcon />}
              value={email}
            />

            <InfoLine
              icon={<PhoneOutlinedIcon />}
              value={phone}
            />
          </Stack>

          {/* Actions */}

          <Stack
            direction="row"
            spacing={1}
          >
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<VisibilityOutlinedIcon />}
              onClick={onView}
              sx={{
                height: 36,
                borderRadius: 1.8,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              View
            </Button>

            <IconButton
              onClick={onEdit}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.8,
                border: "1px solid #dbe4f0",
                color: "#2563eb",
              }}
              aria-label="Edit customer"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              onClick={onDelete}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.8,
                border: "1px solid #fecaca",
                color: "#dc2626",
              }}
              aria-label="Delete customer"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================
   INFO LINE
========================= */

function InfoLine({ icon, value }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      minWidth={0}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          background: "#f8fafc",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontSize: 12,
          color: "#475569",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================
   DETAIL ROW
========================= */

function DetailRow({
  icon,
  label,
  value,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.8,
          background: "#f8fafc",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box minWidth={0}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 800,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.3,
            fontSize: 13,
            color: "#334155",
            fontWeight: 600,
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/* =========================
   EMPTY STATE
========================= */

function CustomerEmptyState({
  hasCustomers,
  onClear,
  onAdd,
}) {
  return (
    <Box
      sx={{
        px: 3,
        py: 7,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          mx: "auto",
          borderRadius: "50%",
          background: "#eff6ff",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PeopleIcon sx={{ fontSize: 30 }} />
      </Box>

      <Typography
        sx={{
          mt: 2,
          fontSize: 15,
          fontWeight: 800,
          color: "#475569",
        }}
      >
        {hasCustomers
          ? "No matching customers"
          : "No customers found"}
      </Typography>

      <Typography
        sx={{
          mt: 0.6,
          fontSize: 12,
          color: "#94a3b8",
          maxWidth: 420,
          mx: "auto",
        }}
      >
        {hasCustomers
          ? "Try changing your search criteria."
          : "Start by adding your first customer to the banking system."}
      </Typography>

      <Stack
        direction="row"
        justifyContent="center"
        spacing={1}
        sx={{ mt: 2 }}
      >
        {hasCustomers ? (
          <Button
            onClick={onClear}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            Clear Search
          </Button>
        ) : (
          <Button
            onClick={onAdd}
            variant="contained"
            startIcon={<PersonAddAlt1Icon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            Add Customer
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export default Customers;