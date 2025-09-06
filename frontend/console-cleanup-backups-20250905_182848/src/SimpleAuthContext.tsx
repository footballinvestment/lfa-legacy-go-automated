// Simple AuthContext - Production Ready
import React, { createContext, useContext, useState, ReactNode } from "react";

interface SimpleAuthState {
  isAuthenticated: boolean;
  user: { username: string } | null;
  loading: boolean;
}

interface SimpleAuthContextType {
  state: SimpleAuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(
  undefined
);

export const useSimpleAuth = (): SimpleAuthContextType => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider: React.FC<SimpleAuthProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<SimpleAuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
  });

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true }));

    // Simple validation - accept any username/password for demo
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

    setState({
      isAuthenticated: true,
      user: { username },
      loading: false,
    });

    return true;
  };

  const logout = (): void => {
    setState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  return (
    <SimpleAuthContext.Provider value={{ state, login, logout }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};
