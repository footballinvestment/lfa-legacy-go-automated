// === frontend/src/contexts/AuthContext.tsx ===
// CLEAN AUTH CONTEXT - NO MOCK ADMIN LOGIC

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import { authService, RegisterRequest, User } from "../services/api";

// ✅ RegisterData interface
export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string; // ✅ REQUIRED FIELD
  name?: string; // Optional backward compatibility
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sessionExpiry: Date | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "SET_SESSION_EXPIRY"; payload: Date }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  sessionExpiry: null,
};

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
        loading: false,
        error: null,
        user: action.payload,
        isAuthenticated: true,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
        isAuthenticated: false,
      };
    case "AUTH_LOGOUT":
      return {
        ...initialState,
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

interface AuthContextType {
  state: AuthState;
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          dispatch({ type: "AUTH_START" });

          // ✅ CRITICAL FIX: Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout after 10 seconds')), 10000)
          );

          // Race between API call and timeout
          let userData;
          try {
            userData = await Promise.race([
              authService.getCurrentUser(),
              timeoutPromise
            ]);
          } catch (error) {
            console.error('Auth initialization failed:', error);
            throw new Error("Authentication timeout or failed");
          }

          // CRITICAL FIX: Proper validation to prevent React Error #130
          if (!userData || typeof userData !== 'object' || userData.constructor === Error || userData.message) {
            console.error('Invalid user data type:', typeof userData, userData);
            throw new Error("Invalid user data received - got: " + typeof userData);
          }

          const user: User = {
            ...userData,
            display_name: userData.display_name,
            bio: userData.bio,
            games_lost: userData.games_lost,
            challenge_wins: userData.challenge_wins,
            challenge_losses: userData.challenge_losses,
            is_premium: userData.is_premium ?? false,
            premium_expires_at: userData.premium_expires_at,
            last_activity: userData.last_activity,
          };

          dispatch({ type: "AUTH_SUCCESS", payload: user });

          // Calculate session expiry from JWT token
          try {
            const tokenData = JSON.parse(atob(token.split(".")[1]));
            const expiry = new Date(tokenData.exp * 1000);
            dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
          } catch (e) {
            // If token parsing fails, set default expiry
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 12);
            dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          localStorage.removeItem("auth_token");
          dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
        }
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: "" });
      }
    };

    initializeAuth();
  }, []);

  // ✅ CRITICAL FIX: Fallback timeout to force loading state to false
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.warn('⚠️ Auth initialization timeout - forcing loading state to false');
      dispatch({ type: "AUTH_FAILURE", payload: "Authentication timeout" });
    }, 15000);
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      // ✅ CLEAN: Only real API login
      const response = await authService.login(data);

      localStorage.setItem("auth_token", response.access_token);

      const user: User = {
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

      dispatch({ type: "AUTH_SUCCESS", payload: user });

      // Set session expiry
      const expiry = new Date();
      expiry.setTime(expiry.getTime() + response.expires_in * 1000);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

      return true;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      // ✅ Validation
      if (!data.full_name || data.full_name.trim().length === 0) {
        throw new Error("Full name is required");
      }

      const response = await authService.register(data);

      localStorage.setItem("auth_token", response.access_token);

      const user: User = {
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

      dispatch({ type: "AUTH_SUCCESS", payload: user });

      const expiry = new Date();
      expiry.setTime(expiry.getTime() + response.expires_in * 1000);
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
      // ✅ CLEAN: Only real API logout
      await authService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
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

  const refreshStats = async (): Promise<void> => {
    const token = localStorage.getItem("auth_token");

    if (!token) return;

    try {
      // ✅ CLEAN: Only real API refresh
      const userData = await authService.getCurrentUser();
      dispatch({ type: "UPDATE_USER", payload: userData });
    } catch (error) {
      console.error("Failed to refresh user stats:", error);
    }
  };

  return (
    <AuthContext.Provider
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
    </AuthContext.Provider>
  );
};

// Protected Route Component
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { state } = useAuth();

  if (state.loading) {
    return <div>Loading...</div>;
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if authenticated)
export const PublicRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { state } = useAuth();

  if (state.loading) {
    return <div>Loading...</div>;
  }

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
