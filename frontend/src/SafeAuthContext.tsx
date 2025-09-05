// frontend/src/SafeAuthContext.tsx
// PRODUCTION READY - NO DEBUG LOGS VERSION

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { authService, User } from "./services/api";

// Define LoginData and RegisterData interfaces locally to avoid import issues
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

interface AuthState {
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
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "SET_SESSION_EXPIRY"; payload: Date };

interface AuthContextType {
  state: AuthState;
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  refreshStats: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  sessionExpiry: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        loading: false,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        loading: false,
        user: null,
        isAuthenticated: false,
        error: action.payload,
        sessionExpiry: null,
      };
    case "LOGOUT":
      return { ...initialState, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "UPDATE_USER":
      return { ...state, user: action.payload };
    case "SET_SESSION_EXPIRY":
      return { ...state, sessionExpiry: action.payload };
    default:
      return state;
  }
};

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
        const userData = await authService.getCurrentUser();

        if (!userData || typeof userData !== "object") {
          throw new Error("Invalid user data received");
        }

        const safeUser: User = {
          id: userData.id || 0,
          username: userData.username || "",
          email: userData.email || "",
          full_name: userData.full_name || userData.name || "",
          display_name: userData.display_name || userData.full_name || userData.name || "",
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
          is_premium: userData.is_premium || false,
          premium_expires_at: userData.premium_expires_at || undefined,
          user_type: userData.user_type || "user",
          is_active: userData.is_active !== false,
          is_admin: userData.is_admin || false,
          mfa_enabled: userData.mfa_enabled || false,
          created_at: userData.created_at || new Date().toISOString(),
          last_login: userData.last_login || undefined,
          last_activity: userData.last_activity || undefined,
        };

        dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

        // Safe session expiry calculation
        try {
          const expiry = new Date();
          expiry.setTime(expiry.getTime() + 43200 * 1000); // 12 hours default
          dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
        } catch (expiryError) {
          // Session expiry calculation failed, but auth is still successful
          const fallbackExpiry = new Date();
          fallbackExpiry.setTime(fallbackExpiry.getTime() + 43200 * 1000);
          dispatch({ type: "SET_SESSION_EXPIRY", payload: fallbackExpiry });
        }
      } catch (error) {
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
        full_name: response.user.full_name || response.user.name || "",
        display_name: response.user.display_name || response.user.full_name || "",
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
        is_premium: response.user.is_premium || false,
        premium_expires_at: response.user.premium_expires_at || undefined,
        user_type: response.user.user_type || "user",
        is_active: response.user.is_active !== false,
        is_admin: response.user.is_admin || false,
        mfa_enabled: response.user.mfa_enabled || false,
        created_at: response.user.created_at || new Date().toISOString(),
        last_login: response.user.last_login || undefined,
        last_activity: response.user.last_activity || undefined,
      };

      dispatch({ type: "AUTH_SUCCESS", payload: safeUser });

      // Set session expiry
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
      const response = await authService.register(data);

      if (!response || !response.access_token || !response.user) {
        throw new Error("Invalid registration response");
      }

      localStorage.setItem("auth_token", response.access_token);

      const safeUser: User = {
        id: response.user.id || 0,
        username: response.user.username || "",
        email: response.user.email || "",
        full_name: response.user.full_name || response.user.name || "",
        display_name: response.user.display_name || response.user.full_name || "",
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
        is_premium: response.user.is_premium || false,
        premium_expires_at: response.user.premium_expires_at || undefined,
        user_type: response.user.user_type || "user",
        is_active: response.user.is_active !== false,
        is_admin: response.user.is_admin || false,
        mfa_enabled: response.user.mfa_enabled || false,
        created_at: response.user.created_at || new Date().toISOString(),
        last_login: response.user.last_login || undefined,
        last_activity: response.user.last_activity || undefined,
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
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem("auth_token");
      dispatch({ type: "LOGOUT" });
    }
  };

  const updateUser = (user: User): void => {
    dispatch({ type: "UPDATE_USER", payload: user });
  };

  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshStats = async (): Promise<void> => {
    if (state.user) {
      try {
        const updatedUser = await authService.getCurrentUser();
        if (updatedUser) {
          updateUser(updatedUser);
        }
      } catch (error) {
        // Silently fail stats refresh
      }
    }
  };

  const contextValue: AuthContextType = {
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

// Export additional components
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useSafeAuth();

  if (state.loading) {
    return <div>Loading...</div>;
  }

  if (!state.isAuthenticated) {
    return <div>Access denied. Please log in.</div>;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useSafeAuth();

  if (state.loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default SafeAuthProvider;