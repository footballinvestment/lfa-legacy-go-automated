// src/components/layout/Layout.tsx
// LFA Legacy GO - Main Layout with Navigation

import React, { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Avatar,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  LocationOn,
  CalendarMonth,
  People,
  EmojiEvents,
  AccountBalanceWallet,
  SportsScore,
  Logout,
  Menu as MenuIcon,
  Timeline,
  Assessment,
  ShowChart,
  SupervisorAccount,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const drawerWidth = 280;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Check if user is admin
  const isAdmin = state.user?.user_type === 'admin' || 
                  state.user?.role === 'admin' || 
                  state.user?.is_admin === true;

  const navigationItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      color: "primary.main",
    },
    {
      text: "Locations",
      icon: <LocationOn />,
      path: "/locations",
      color: "secondary.main",
    },
    {
      text: "Booking",
      icon: <CalendarMonth />,
      path: "/booking",
      color: "success.main",
    },
    { text: "Social", icon: <People />, path: "/social", color: "info.main" },
    {
      text: "Tournaments",
      icon: <EmojiEvents />,
      path: "/tournaments",
      color: "warning.main",
    },
    {
      text: "Live Feed",
      icon: <Timeline />,
      path: "/tournaments/live-feed",
      color: "error.main",
    },
    {
      text: "Analytics",
      icon: <Assessment />,
      path: "/tournaments/analytics",
      color: "success.main",
    },
    {
      text: "Charts Library",
      icon: <ShowChart />,
      path: "/tournaments/charts",
      color: "info.main",
    },
    {
      text: "Game Results",
      icon: <SportsScore />,
      path: "/game-results",
      color: "error.main",
    },
    {
      text: "Credits",
      icon: <AccountBalanceWallet />,
      path: "/credits",
      color: "purple.main",
    },
  ];

  // Add admin navigation item if user is admin
  const adminNavigationItems = isAdmin ? [
    {
      text: "Admin Panel",
      icon: <SupervisorAccount />,
      path: "/admin",
      color: "error.main",
      isAdmin: true,
    },
  ] : [];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #1e293b, #334155)",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 40,
              height: 40,
              fontSize: "1.2rem",
            }}
          >
            ⚽
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              LFA Legacy GO
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Football Gaming Platform
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 32,
              height: 32,
              fontSize: "0.9rem",
            }}
          >
            {state.user?.full_name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "white" }}
              noWrap
            >
              {state.user?.full_name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip
                label={`${state.user?.credits || 0} credits`}
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  height: 20,
                  backgroundColor: "rgba(16,185,129,0.2)",
                  color: "#10b981",
                }}
              />
              <Chip
                label={`Level ${state.user?.level || 1}`}
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  height: 20,
                  backgroundColor: "rgba(59,130,246,0.2)",
                  color: "#3b82f6",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <List sx={{ flex: 1, px: 1 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  backgroundColor: isActive ? "primary.main" : "transparent",
                  color: isActive ? "white" : "inherit",
                  "&:hover": {
                    backgroundColor: isActive ? "primary.dark" : "action.hover",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon
                  sx={{ color: isActive ? "white" : item.color, minWidth: 40 }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
        
        {/* Admin Section */}
        {adminNavigationItems.length > 0 && (
          <>
            <Divider sx={{ mx: 2, my: 2 }} />
            {adminNavigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      backgroundColor: isActive ? "error.main" : "transparent",
                      color: isActive ? "white" : "inherit",
                      "&:hover": {
                        backgroundColor: isActive ? "error.dark" : "action.hover",
                      },
                      transition: "all 0.2s ease",
                      border: `1px solid ${isActive ? "transparent" : "error.main"}`,
                    }}
                  >
                    <ListItemIcon
                      sx={{ color: isActive ? "white" : item.color, minWidth: 40 }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ 
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "white" : "error.main"
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}
      </List>

      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Logout />}
          onClick={logout}
          sx={{
            borderColor: "error.main",
            color: "error.main",
            "&:hover": {
              borderColor: "error.dark",
              backgroundColor: "error.main",
              color: "white",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: { sm: "none" },
        }}
      >
        <Toolbar>
          <Button color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </Button>
          <Typography variant="h6" noWrap component="div">
            LFA Legacy GO
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Toolbar sx={{ display: { sm: "none" } }} />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default Layout;
