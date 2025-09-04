// SafeAuthContext.tsx - FIXED VERSION
// Contains all necessary admin fields for proper admin panel access

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authService, User } from "./services/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sessionExpiry: Date | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  sessionExpiry: null,
};

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "SET_SESSION_EXPIRY"; payload: Date }
  | { type: "CLEAR_ERROR" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        sessionExpiry: null,
      };
    case "LOGOUT":
      return {
        ...initialState,
        loading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "SET_SESSION_EXPIRY":
      return {
        ...state,
        sessionExpiry: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  state: AuthState;
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  refreshStats: () => Promise<void>;
}

const SafeAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSafeAuth = (): AuthContextType => {
  const context = useContext(SafeAuthContext);
  if (context === undefined) {
    throw new Error("useSafeAuth must be used within a SafeAuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const SafeAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        dispatch({ type: "AUTH_FAILURE", payload: "" });
        return;
      }

      try {
        dispatch({ type: "AUTH_START" });

        // CRITICAL FIX: Safe API call with proper timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const userData = await authService.getCurrentUser();
        clearTimeout(timeoutId);

        // CRITICAL FIX: Validate response before using
        if (!userData || typeof userData !== "object") {
          throw new Error("Invalid user data received");
        }

        // CRITICAL FIX: Safe user object creation WITH ADMIN FIELDS
        const safeUser: User = {
          id: userData.id || 0,
          username: userData.username || "",
          email: userData.email || "",
          full_name: userData.full_name || "",
          display_name: userData.display_name || userData.full_name || userData.username || "",
          bio: userData.bio || "",
          level: userData.level || 1,
          xp: userData.xp || 0,
          credits: userData.credits || 0,
          skills: userData.skills || {},
          games_played: userData.games_played || 0,
          games_won: userData.games_won || 0,
          games_lost: userData.games_lost || 0,
          friend_count: userData.friend_count || 0,
          challenge_wins: userData.challenge_wins || 0,
          challenge_losses: userData.challenge_losses || 0,
          total_achievements: userData.total_achievements || 0,
          is_premium: Boolean(userData.is_premium),
          premium_expires_at: userData.premium_expires_at || undefined,
          user_type: userData.user_type || "user", // ✅ ADMIN FIELD!
          is_active: userData.is_active !== false,
          is_admin: userData.user_type === "admin" || userData.user_type === "moderator" || userData.is_admin || false, // ✅ ADMIN FIELD!
          mfa_enabled: Boolean(userData.mfa_enabled || false), // ✅ MFA FIELD! (fallback to false while backend deploys)
          created_at: userData.created_at || "",
          last_login: userData.last_login || undefined,
          last_activity: userData.last_activity || undefined,
        };

        dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

        // Safe session expiry calculation
        try {
          const tokenData = JSON.parse(atob(token.split(".")[1]));
          const expiry = new Date(tokenData.exp * 1000);
          dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
        } catch (e) {
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 12);
          dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        localStorage.removeItem("auth_token");
        dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });
      console.log("Login attempt for user:", data.username);

      const response = await authService.login(data);
      console.log("Login response received:", {
        hasToken: !!response?.access_token,
        hasUser: !!response?.user,
        userId: response?.user?.id,
        userType: response?.user?.user_type, // Debug admin type
      });

      if (!response || !response.access_token || !response.user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("auth_token", response.access_token);

      // CRITICAL FIX: Safe user object creation WITH ADMIN FIELDS
      const safeUser: User = {
        id: response.user.id || 0,
        username: response.user.username || "",
        email: response.user.email || "",
        full_name: response.user.full_name || "",
        display_name: response.user.display_name || response.user.full_name || response.user.username || "",
        bio: response.user.bio || "",
        level: response.user.level || 1,
        xp: response.user.xp || 0,
        credits: response.user.credits || 0,
        skills: response.user.skills || {},
        games_played: response.user.games_played || 0,
        games_won: response.user.games_won || 0,
        games_lost: response.user.games_lost || 0,
        friend_count: response.user.friend_count || 0,
        challenge_wins: response.user.challenge_wins || 0,
        challenge_losses: response.user.challenge_losses || 0,
        total_achievements: response.user.total_achievements || 0,
        is_premium: Boolean(response.user.is_premium),
        premium_expires_at: response.user.premium_expires_at || undefined,
        user_type: response.user.user_type || "user", // ✅ ADMIN FIELD!
        is_active: response.user.is_active !== false,
        is_admin: response.user.user_type === "admin" || response.user.user_type === "moderator" || response.user.is_admin || false, // ✅ ADMIN FIELD!
        mfa_enabled: Boolean(response.user.mfa_enabled || false), // ✅ MFA FIELD!
        created_at: response.user.created_at || "",
        last_login: response.user.last_login || undefined,
        last_activity: response.user.last_activity || undefined,
      };

      dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

      const expiry = new Date();
      expiry.setTime(expiry.getTime() + (response.expires_in || 43200) * 1000);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

      console.log("✅ Login successful for user:", response.user.username, "| Admin:", safeUser.is_admin);
      return true;
    } catch (error: any) {
      console.error("Login failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack,
      });

      const errorMessage =
        error.response?.data?.detail || error.message || "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      if (!data.full_name || data.full_name.trim().length === 0) {
        throw new Error("Full name is required");
      }

      const response = await authService.register(data);

      if (!response || !response.access_token || !response.user) {
        throw new Error("Invalid registration response");
      }

      localStorage.setItem("auth_token", response.access_token);

      // CRITICAL FIX: Safe user object creation WITH ADMIN FIELDS
      const safeUser: User = {
        id: response.user.id || 0,
        username: response.user.username || "",
        email: response.user.email || "",
        full_name: response.user.full_name || "",
        display_name: response.user.display_name || response.user.full_name || response.user.username || "",
        bio: response.user.bio || "",
        level: response.user.level || 1,
        xp: response.user.xp || 0,
        credits: response.user.credits || 0,
        skills: response.user.skills || {},
        games_played: response.user.games_played || 0,
        games_won: response.user.games_won || 0,
        games_lost: response.user.games_lost || 0,
        friend_count: response.user.friend_count || 0,
        challenge_wins: response.user.challenge_wins || 0,
        challenge_losses: response.user.challenge_losses || 0,
        total_achievements: response.user.total_achievements || 0,
        is_premium: Boolean(response.user.is_premium),
        premium_expires_at: response.user.premium_expires_at || undefined,
        user_type: response.user.user_type || "user", // ✅ ADMIN FIELD!
        is_active: response.user.is_active !== false,
        is_admin: response.user.user_type === "admin" || response.user.user_type === "moderator" || response.user.is_admin || false, // ✅ ADMIN FIELD!
        mfa_enabled: Boolean(response.user.mfa_enabled || false), // ✅ MFA FIELD!
        created_at: response.user.created_at || "",
        last_login: response.user.last_login || undefined,
        last_activity: response.user.last_activity || undefined,
      };

      dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

      const expiry = new Date();
      expiry.setTime(expiry.getTime() + (response.expires_in || 43200) * 1000);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

      return true;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Registration failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Complete cleanup
      localStorage.clear();
      sessionStorage.clear();

      // Clear any potential auth-related cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });

      dispatch({ type: "LOGOUT" });
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshStats = async (): Promise<void> => {
    if (!state.user) return;

    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        updateUser({
          games_won: userData.games_won || 0,
          games_lost: userData.games_lost || 0,
          challenge_wins: userData.challenge_wins || 0,
          challenge_losses: userData.challenge_losses || 0,
          credits: userData.credits || 0,
        });
      }
    } catch (error) {
      console.error("Failed to refresh stats:", error);
    }
  };

  return (
    <SafeAuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        updateUser,
        clearError,
        refreshStats,
      }}
    >
      {children}
    </SafeAuthContext.Provider>
  );
};

// Protected Route Component
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { state } = useSafeAuth();

  if (state.loading) {
    const loadingStyle = {
      display: "flex" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      height: "100vh",
      flexDirection: "column" as const,
    };

    return (
      <div style={loadingStyle}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component
export const PublicRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { state } = useSafeAuth();

  if (state.loading) {
    const loadingStyle = {
      display: "flex" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      height: "100vh",
      flexDirection: "column" as const,
    };

    return (
      <div style={loadingStyle}>
        <div>Loading...</div>
      </div>
    );
  }

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default SafeAuthProvider;