import { useEffect, useMemo, useState } from "react";

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
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";

import api from "../services/api";

function Customers() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");

      setCustomers(response.data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar((previous) => ({
      ...previous,
      open: false,
    }));
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setEditingCustomer(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (customer) => {
    setEditingCustomer(customer);

    setName(customer.name || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");

    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      setSaving(true);

      const customerData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      if (editingCustomer) {
        const response = await api.put(
          `/customers/${editingCustomer.id}`,
          customerData
        );

        setCustomers((previous) =>
          previous.map((customer) =>
            customer.id === editingCustomer.id
              ? response.data
              : customer
          )
        );

        showMessage("Customer updated successfully.");
      } else {
        const response = await api.post(
          "/customers",
          customerData
        );

        setCustomers((previous) => [
          ...previous,
          response.data,
        ]);

        showMessage("Customer created successfully.");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Customer save failed:", error);

      showMessage(
        error.response?.data?.message ||
          "Failed to save customer.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleDelete = async () => {
    if (!customerToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(
        `/customers/${customerToDelete.id}`
      );

      setCustomers((previous) =>
        previous.filter(
          (customer) =>
            customer.id !== customerToDelete.id
        )
      );

      showMessage("Customer deleted successfully.");

      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Customer deletion failed:", error);

      showMessage(
        error.response?.data?.message ||
          "Failed to delete customer.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        String(customer.id)
          .toLowerCase()
          .includes(query) ||
        String(customer.name || "")
          .toLowerCase()
          .includes(query) ||
        String(customer.email || "")
          .toLowerCase()
          .includes(query) ||
        String(customer.phone || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [customers, search]);

  const getInitials = (customerName = "") => {
    const words = customerName
      .trim()
      .split(" ")
      .filter(Boolean);

    if (words.length === 0) {
      return "?";
    }

    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h6"
          color="text.secondary"
        >
          Loading customers...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        {/* HEADER */}

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
          spacing={3}
          mb={4}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Avatar
              sx={{
                width: 58,
                height: 58,
                bgcolor: "#2563eb",
              }}
            >
              <PeopleAltOutlinedIcon />
            </Avatar>

            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                color="#0f172a"
              >
                Customers
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Manage bank customers
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            size="large"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={openAddDialog}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 1.3,
            }}
          >
            Add Customer
          </Button>
        </Stack>

        {/* STAT CARDS */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2.5,
            mb: 3,
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Customers
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                mt={1}
              >
                {customers.length}
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Active Customers
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                color="#16a34a"
                mt={1}
              >
                {customers.length}
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Search Results
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                color="#7c3aed"
                mt={1}
              >
                {filteredCustomers.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* CUSTOMER LIST */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            {/* SEARCH */}

            <TextField
              fullWidth
              placeholder="Search by name, email, phone or ID..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon />
                  </InputAdornment>
                ),

                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearch("")}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                mb: 3,

                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                },
              }}
            />

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
              >
                {error}
              </Alert>
            )}

            {/* MOBILE */}

            {isMobile ? (
              <Stack spacing={2}>
                {filteredCustomers.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 5,
                      textAlign: "center",
                      border:
                        "1px dashed #cbd5e1",
                      borderRadius: 3,
                    }}
                  >
                    <PeopleAltOutlinedIcon
                      sx={{
                        fontSize: 50,
                        color: "#94a3b8",
                      }}
                    />

                    <Typography
                      fontWeight={700}
                      mt={1}
                    >
                      No customers found
                    </Typography>
                  </Paper>
                ) : (
                  filteredCustomers.map(
                    (customer) => (
                      <Card
                        key={customer.id}
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
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "#dbeafe",
                                  color: "#1d4ed8",
                                  fontWeight: 700,
                                }}
                              >
                                {getInitials(
                                  customer.name
                                )}
                              </Avatar>

                              <Box>
                                <Typography
                                  fontWeight={700}
                                >
                                  {customer.name}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Customer #
                                  {customer.id}
                                </Typography>
                              </Box>
                            </Stack>

                            <Chip
                              label="Active"
                              color="success"
                              size="small"
                            />
                          </Stack>

                          <Divider sx={{ my: 2 }} />

                          <Typography
                            variant="body2"
                            mb={1}
                          >
                            <strong>Email:</strong>{" "}
                            {customer.email || "N/A"}
                          </Typography>

                          <Typography
                            variant="body2"
                            mb={2}
                          >
                            <strong>Phone:</strong>{" "}
                            {customer.phone || "N/A"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                          >
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={
                                <EditOutlinedIcon />
                              }
                              onClick={() =>
                                openEditDialog(
                                  customer
                                )
                              }
                              sx={{
                                textTransform:
                                  "none",
                              }}
                            >
                              Edit
                            </Button>

                            <Button
                              fullWidth
                              variant="outlined"
                              color="error"
                              startIcon={
                                <DeleteOutlineOutlinedIcon />
                              }
                              onClick={() =>
                                openDeleteDialog(
                                  customer
                                )
                              }
                              sx={{
                                textTransform:
                                  "none",
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    )
                  )
                )}
              </Stack>
            ) : (
              /* DESKTOP */

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <TableCell>
                        <strong>Customer</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Email</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Phone</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredCustomers.length ===
                    0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                        >
                          <Box py={6}>
                            <PeopleAltOutlinedIcon
                              sx={{
                                fontSize: 50,
                                color: "#cbd5e1",
                              }}
                            />

                            <Typography
                              fontWeight={700}
                              mt={1}
                            >
                              No customers found
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map(
                        (customer) => (
                          <TableRow
                            key={customer.id}
                            hover
                          >
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: "#dbeafe",
                                    color: "#1d4ed8",
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(
                                    customer.name
                                  )}
                                </Avatar>

                                <Box>
                                  <Typography
                                    fontWeight={700}
                                  >
                                    {customer.name}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Customer #
                                    {customer.id}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              {customer.email ||
                                "N/A"}
                            </TableCell>

                            <TableCell>
                              {customer.phone ||
                                "N/A"}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label="Active"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>

                            <TableCell align="right">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  openEditDialog(
                                    customer
                                  )
                                }
                              >
                                <EditOutlinedIcon />
                              </IconButton>

                              <IconButton
                                color="error"
                                onClick={() =>
                                  openDeleteDialog(
                                    customer
                                  )
                                }
                              >
                                <DeleteOutlineOutlinedIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ADD / EDIT DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={800}>
            {editingCustomer
              ? "Edit Customer"
              : "Add New Customer"}
          </DialogTitle>

          <DialogContent>
            <Typography
              variant="body2"
              color="text.secondary"
              mb={2}
            >
              Enter the customer's information.
            </Typography>

            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              margin="normal"
              required
            />
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={closeDialog}
              disabled={saving}
              sx={{
                textTransform: "none",
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {saving
                ? "Saving..."
                : editingCustomer
                ? "Update Customer"
                : "Create Customer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE DIALOG */}

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight={800}>
          Delete Customer?
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{" "}
            <strong>
              {customerToDelete?.name}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={deleting}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MESSAGE */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={closeSnackbar}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Customers; 
