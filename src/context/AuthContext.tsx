import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/api";
import type { User } from "../services/api";

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  login: (data: LoginInput) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const isAuthenticated = user !== null;

  const hydrate = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = useCallback(async (data: LoginInput) => {
    const currentUser = await loginUser(data);
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const currentUser = await registerUser(data);
    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((currentUser) =>
      currentUser ? { ...currentUser, ...updates } : currentUser,
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isHydrating,
      login,
      register,
      logout,
      updateUser,
    }),
    [
      user,
      isAuthenticated,
      isHydrating,
      login,
      register,
      logout,
      updateUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
