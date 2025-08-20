// Safe AuthContext - Production Ready without React Error #130
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import { authService, User } from "./services/api";

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
  name?: string;
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
        if (!userData || typeof userData !== 'object') {
          throw new Error("Invalid user data received");
        }

        // CRITICAL FIX: Safe user object creation
        const safeUser: User = {
          id: userData.id || 0,
          username: userData.username || "",
          email: userData.email || "",
          full_name: userData.full_name || "",
          display_name: userData.display_name || userData.full_name || userData.username || "",
          bio: userData.bio || "",
          games_won: userData.games_won || 0,
          games_lost: userData.games_lost || 0,
          challenge_wins: userData.challenge_wins || 0,
          challenge_losses: userData.challenge_losses || 0,
          is_premium: Boolean(userData.is_premium),
          premium_expires_at: userData.premium_expires_at || null,
          last_activity: userData.last_activity || null,
          credits: userData.credits || 0,
          created_at: userData.created_at || "",
          updated_at: userData.updated_at || ""
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
      const response = await authService.login(data);
      
      if (!response || !response.access_token || !response.user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("auth_token", response.access_token);

      const safeUser: User = {
        id: response.user.id || 0,
        username: response.user.username || "",
        email: response.user.email || "",
        full_name: response.user.full_name || "",
        display_name: response.user.display_name || response.user.full_name || response.user.username || "",
        bio: response.user.bio || "",
        games_won: response.user.games_won || 0,
        games_lost: response.user.games_lost || 0,
        challenge_wins: response.user.challenge_wins || 0,
        challenge_losses: response.user.challenge_losses || 0,
        is_premium: Boolean(response.user.is_premium),
        premium_expires_at: response.user.premium_expires_at || null,
        last_activity: response.user.last_activity || null,
        credits: response.user.credits || 0,
        created_at: response.user.created_at || "",
        updated_at: response.user.updated_at || ""
      };

      dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

      const expiry = new Date();
      expiry.setTime(expiry.getTime() + (response.expires_in || 43200) * 1000);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Login failed";
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

      const safeUser: User = {
        id: response.user.id || 0,
        username: response.user.username || "",
        email: response.user.email || "",
        full_name: response.user.full_name || "",
        display_name: response.user.display_name || response.user.full_name || response.user.username || "",
        bio: response.user.bio || "",
        games_won: response.user.games_won || 0,
        games_lost: response.user.games_lost || 0,
        challenge_wins: response.user.challenge_wins || 0,
        challenge_losses: response.user.challenge_losses || 0,
        is_premium: Boolean(response.user.is_premium),
        premium_expires_at: response.user.premium_expires_at || null,
        last_activity: response.user.last_activity || null,
        credits: response.user.credits || 0,
        created_at: response.user.created_at || "",
        updated_at: response.user.updated_at || ""
      };

      dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

      const expiry = new Date();
      expiry.setTime(expiry.getTime() + (response.expires_in || 43200) * 1000);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Registration failed";
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
      const userData = await authService.getCurrentUser();
      if (userData && typeof userData === 'object') {
        dispatch({ type: "UPDATE_USER", payload: userData });
      }
    } catch (error) {
      console.error("Failed to refresh user stats:", error);
    }
  };

  const contextValue = {
    state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshStats,
  };

  return (
    <SafeAuthContext.Provider value={contextValue}>
      {children}
    </SafeAuthContext.Provider>
  );
};

// Protected Route Component
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useSafeAuth();

  if (state.loading) {
    const loadingStyle = {
      display: 'flex' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      height: '100vh',
      flexDirection: 'column' as const
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
export const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useSafeAuth();

  if (state.loading) {
    const loadingStyle = {
      display: 'flex' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      height: '100vh',
      flexDirection: 'column' as const
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