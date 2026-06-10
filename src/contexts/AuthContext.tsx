import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthState {
  token: string;
  username: string;
  allowedBusinesses: string[] | null;
}

interface AuthContextType {
  user: AuthState | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canAccess: (businessName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(() => {
    const stored = sessionStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error);
    }
    const data = await res.json();
    const auth: AuthState = {
      token: data.token,
      username: data.username,
      allowedBusinesses: data.allowedBusinesses,
    };
    sessionStorage.setItem('auth', JSON.stringify(auth));
    setUser(auth);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth');
    setUser(null);
  }, []);

  const canAccess = useCallback(
    (businessName: string) => {
      if (!user) return false;
      if (user.allowedBusinesses === null) return true;
      return user.allowedBusinesses.includes(businessName);
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
