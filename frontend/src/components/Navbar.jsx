import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = String(user?.role || "CUSTOMER").toUpperCase();

 const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },

  ...(role === "ADMIN"
    ? [
        {
          label: "Customers",
          path: "/customers",
          icon: <PeopleIcon fontSize="small" />,
        },
        {
          label: "Deposit",
          path: "/deposit",
          icon: <AddCircleIcon fontSize="small" />,
        },
        {
          label: "Withdraw",
          path: "/withdraw",
          icon: <RemoveCircleIcon fontSize="small" />,
        },
      ]
    : []),

  {
    label: "Accounts",
    path: "/accounts",
    icon: <AccountBalanceOutlinedIcon fontSize="small" />,
  },

  {
    label: "Transfer",
    path: "/transfer",
    icon: <SwapHorizIcon fontSize="small" />,
  },

  {
    label: "UPI",
    path: "/upi",
    icon: <PaymentsOutlinedIcon fontSize="small" />,
  },

  {
    label: "Scan & Pay",
    path: "/scan-pay",
    icon: <QrCode2OutlinedIcon fontSize="small" />,
  },

  {
    label: "Transactions",
    path: "/transactions",
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
  },

  ...(role === "ADMIN"
    ? [
        {
          label: "Admin",
          path: "/admin",
          icon: (
            <AdminPanelSettingsOutlinedIcon fontSize="small" />
          ),
        },
      ]
    : []),
];
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMobileOpen(false);

    navigate("/", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderBottom: "1px solid #e2e8f0",
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
            px: {
              xs: 2,
              sm: 3,
              lg: 4,
            },
            gap: 2,
          }}
        >
          {/* BRAND */}

          <Box
            onClick={() => navigate("/dashboard")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              cursor: "pointer",
              mr: { xs: 0, lg: 2 },
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              B
            </Box>

            <Box
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 15,
                  lineHeight: 1.2,
                }}
              >
                Bank Management
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#94a3b8",
                  mt: 0.2,
                }}
              >
                Banking Platform
              </Typography>
            </Box>
          </Box>

          {/* DESKTOP NAVIGATION */}

          <Box
            sx={{
              flex: 1,
              display: {
                xs: "none",
                lg: "flex",
              },
              alignItems: "center",
              gap: 0.4,
            }}
          >
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  minHeight: 42,
                  px: 1.35,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  color: isActive(item.path)
                    ? "#2563eb"
                    : "#64748b",
                  backgroundColor: isActive(item.path)
                    ? "#eff6ff"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "#f8fafc",
                    color: "#2563eb",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* USER / LOGOUT */}

          <Box
            sx={{
              display: {
                xs: "none",
                lg: "flex",
              },
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                {user?.username || "User"}
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#64748b",
                  mt: 0.3,
                }}
              >
                {role}
              </Typography>
            </Box>

            <Button
              onClick={handleLogout}
              startIcon={<LogoutOutlinedIcon />}
              sx={{
                minHeight: 40,
                px: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                color: "#dc2626",
                "&:hover": {
                  backgroundColor: "#fef2f2",
                },
              }}
            >
              Logout
            </Button>
          </Box>

          {/* MOBILE MENU */}

          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{
              display: {
                xs: "flex",
                lg: "none",
              },
              ml: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 2,
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* MOBILE DRAWER */}

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: {
              xs: "85%",
              sm: 340,
            },
            maxWidth: 340,
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            position: "relative",
            pb: 9,
          }}
        >
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Banking Menu
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  color: "#64748b",
                  mt: 0.3,
                }}
              >
                {user?.username || "User"} · {role}
              </Typography>
            </Box>

            <IconButton onClick={() => setMobileOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ p: 1.5 }}>
            {navigationItems.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: isActive(item.path)
                    ? "#2563eb"
                    : "#475569",
                  backgroundColor: isActive(item.path)
                    ? "#eff6ff"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "#f8fafc",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    mr: 1.5,
                    color: isActive(item.path)
                      ? "#2563eb"
                      : "#64748b",
                  }}
                >
                  {item.icon}
                </Box>

                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path)
                      ? 700
                      : 500,
                  }}
                />
              </ListItemButton>
            ))}
          </List>

          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<LogoutOutlinedIcon />}
              onClick={handleLogout}
              sx={{
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;
