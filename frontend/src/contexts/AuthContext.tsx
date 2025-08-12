// src/contexts/AuthContext.tsx
// LFA Legacy GO - Authentication Context with Enhanced State Management

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../services/api";

// === INTERFACES ===

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  display_name?: string;
  level: number;
  xp: number; // Added missing field
  credits: number;
  bio?: string;
  skills: Record<string, number>;
  games_played: number;
  games_won: number;
  games_lost?: number; // Added optional field
  friend_count: number;
  challenge_wins?: number; // Added optional field
  challenge_losses?: number; // Added optional field
  total_achievements: number;
  is_premium: boolean;
  premium_expires_at?: string;
  user_type: string;
  role?: 'admin' | 'user' | 'moderator';
  is_admin?: boolean;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  last_activity?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiry: Date | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

// === ACTION TYPES ===

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "SET_SESSION_EXPIRY"; payload: Date };

// === REDUCER ===

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionExpiry: null,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
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

    default:
      return state;
  }
};

// === CONTEXT ===

export interface AuthContextType {
  state: AuthState;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
  checkSessionValidity: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// === INITIAL STATE ===

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionExpiry: null,
};

// === PROVIDER ===

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        dispatch({ type: "AUTH_FAILURE", payload: "No token found" });
        return;
      }

      try {
        dispatch({ type: "AUTH_START" });

        // Verify token and get user data
        const user = await authService.getCurrentUser();

        if (user) {
          // Type-safe user conversion
          const authUser: User = {
            ...user,
            display_name: user.display_name,
            bio: user.bio,
            games_lost: user.games_lost,
            challenge_wins: user.challenge_wins,
            challenge_losses: user.challenge_losses,
            is_premium: user.is_premium ?? false,
            premium_expires_at: user.premium_expires_at,
            last_activity: user.last_activity,
          };

          dispatch({ type: "AUTH_SUCCESS", payload: authUser });

          // Set session expiry (assuming 24 hours from now)
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 24);
          dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
        } else {
          throw new Error("Invalid user data");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);

        // Clear invalid token
        localStorage.removeItem("auth_token");
        dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
      }
    };

    initializeAuth();
  }, []);

  // Session validity checker
  const checkSessionValidity = (): boolean => {
    if (!state.sessionExpiry) return false;

    const now = new Date();
    const timeLeft = state.sessionExpiry.getTime() - now.getTime();

    // Session expires in less than 5 minutes
    if (timeLeft < 5 * 60 * 1000) {
      return false;
    }

    return true;
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiry) return;

    const checkAndRefresh = async () => {
      const timeUntilExpiry =
        state.sessionExpiry!.getTime() - new Date().getTime();

      // Refresh 10 minutes before expiry
      if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          await refreshAuth();
        } catch (error) {
          console.error("Auto-refresh failed:", error);
          await logout();
        }
      }
    };

    const interval = setInterval(checkAndRefresh, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.sessionExpiry]);

  // === METHODS ===

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await authService.login(credentials);

      if (response.access_token && response.user) {
        localStorage.setItem("auth_token", response.access_token);

        // Type-safe user conversion
        const authUser: User = {
          ...response.user,
          display_name: response.user.display_name,
          bio: response.user.bio,
          games_lost: response.user.games_lost,
          challenge_wins: response.user.challenge_wins,
          challenge_losses: response.user.challenge_losses,
          is_premium: response.user.is_premium ?? false,
          premium_expires_at: response.user.premium_expires_at,
          last_activity: response.user.last_activity,
        };

        dispatch({ type: "AUTH_SUCCESS", payload: authUser });

        // Set session expiry
        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + response.expires_in);
        dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail?.message ||
        error.message ||
        "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await authService.register(data);

      if (response.access_token && response.user) {
        localStorage.setItem("auth_token", response.access_token);

        // Type-safe user conversion
        const authUser: User = {
          ...response.user,
          display_name: response.user.display_name,
          bio: response.user.bio,
          games_lost: response.user.games_lost,
          challenge_wins: response.user.challenge_wins,
          challenge_losses: response.user.challenge_losses,
          is_premium: response.user.is_premium ?? false,
          premium_expires_at: response.user.premium_expires_at,
          last_activity: response.user.last_activity,
        };

        dispatch({ type: "AUTH_SUCCESS", payload: authUser });

        // Set session expiry
        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + response.expires_in);
        dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail?.message ||
        error.message ||
        "Registration failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint
      await authService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local storage and state regardless
      localStorage.removeItem("auth_token");
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const user = await authService.getCurrentUser();

      if (user) {
        dispatch({ type: "UPDATE_USER", payload: user });

        // Extend session expiry
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
      } else {
        throw new Error("Failed to refresh user data");
      }
    } catch (error) {
      console.error("Auth refresh error:", error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    state,
    user: state.user,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshAuth,
    checkSessionValidity,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// === CUSTOM HOOKS ===

// Hook for protected routes
export const useRequireAuth = () => {
  const { state } = useAuth();

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      window.location.href = "/login";
    }
  }, [state.isLoading, state.isAuthenticated]);

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
  };
};

// Hook for user statistics with auto-refresh
export const useUserStats = () => {
  const { state, updateUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refreshStats = async () => {
    if (!state.user) return;

    setIsRefreshing(true);
    try {
      const user = await authService.getCurrentUser();
      updateUser(user);
    } catch (error) {
      console.error("Failed to refresh user stats:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(refreshStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  return {
    user: state.user,
    isRefreshing,
    refreshStats,
    credits: state.user?.credits ?? 0,
    level: state.user?.level ?? 1,
    xp: state.user?.xp ?? 0, // Added xp field
    gamesPlayed: state.user?.games_played ?? 0,
    gamesWon: state.user?.games_won ?? 0,
    winRate:
      state.user && state.user.games_played > 0
        ? ((state.user.games_won ?? 0) /
            Math.max(state.user.games_played ?? 1, 1)) *
          100
        : 0,
  };
};

// Hook for authentication forms
export const useAuthForm = () => {
  const { state, login, register, clearError } = useAuth();
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (state.error) {
      clearError();
    }
  };

  const handleLogin = async () => {
    return await login({
      username: formData.username,
      password: formData.password,
    });
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      return false;
    }

    return await register({
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name,
      password: formData.password,
    });
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      full_name: "",
      password: "",
      confirmPassword: "",
    });
    clearError();
  };

  return {
    formData,
    handleInputChange,
    handleLogin,
    handleRegister,
    resetForm,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  };
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>Loading...</div>,
}) => {
  const { state } = useAuth();

  if (state.isLoading) {
    return <>{fallback}</>;
  }

  if (!state.isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = "/dashboard",
}) => {
  const { state } = useAuth();

  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      window.location.href = redirectTo;
    }
  }, [state.isAuthenticated, state.isLoading, redirectTo]);

  if (state.isLoading) {
    return <div>Loading...</div>;
  }

  if (state.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
