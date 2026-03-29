/**
 * AuthContext — authenticates against the Spring Boot backend.
 *
 * Spring Security is commented out in the backend, so there is no
 * POST /api/auth/login endpoint. Instead we:
 *  1. GET /api/accounts (all accounts, publicly accessible)
 *  2. Find the matching username + password in that list
 *  3. Map accountType → UserRole
 *
 * Staff accounts (ADMIN, MANAGER, etc.) are seeded in the DB.
 * Merchant accounts have accountType = MERCHANT.
 *
 * This approach is safe for demo purposes. When Spring Security
 * is enabled, swap login() for a real POST /api/auth/login call.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { api } from '@/api/client';
import type { ApiUserAccount } from '@/api/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login:   (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:  () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Map backend AccountType → frontend UserRole
const ACCOUNT_TYPE_TO_ROLE: Record<string, UserRole> = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  MERCHANT:'merchant',
  // Staff roles not in the backend enum — keep local fallback
};

// Local staff fallback (no backend rows for warehouse/clerk/delivery)
// These are used ONLY if the backend doesn't have those accounts yet.
const LOCAL_STAFF: (User & { password: string })[] = [
  { id: 'local-3', username: 'accountant', password: 'Count_money',  role: 'manager' },
  { id: 'local-4', username: 'clerk',      password: 'Paperwork',    role: 'clerk' },
  { id: 'local-5', username: 'warehouse1', password: 'Get_a_beer',   role: 'warehouse' },
  { id: 'local-6', username: 'warehouse2', password: 'Lot_smell',    role: 'warehouse' },
  { id: 'local-7', username: 'delivery',   password: 'Too_dark',     role: 'delivery' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('ipos_user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    // 1. Try local staff fallback first (warehouse, clerk, delivery — not in DB)
    const localMatch = LOCAL_STAFF.find(
      u => u.username === username && u.password === password
    );
    if (localMatch) {
      const { password: _pw, ...safeUser } = localMatch;
      void _pw;
      setUser(safeUser);
      sessionStorage.setItem('ipos_user', JSON.stringify(safeUser));
      return { success: true };
    }

    // 2. Fetch accounts from backend and find a matching user
    try {
      const accounts = await api.get<ApiUserAccount[]>('/accounts');
      const match = accounts.find(
        a => a.username === username && a.password === password
      );

      if (!match) return { success: false, error: 'Invalid username or password.' };

      const role: UserRole = ACCOUNT_TYPE_TO_ROLE[match.accountType] ?? 'clerk';
      const safeUser: User = {
        id:         String(match.accountId),
        username:   match.username,
        role,
        // For merchants, merchantId = their ACC string (e.g. ACC0001)
        merchantId: role === 'merchant'
          ? `ACC${String(match.accountId).padStart(4, '0')}`
          : undefined,
      };

      setUser(safeUser);
      sessionStorage.setItem('ipos_user', JSON.stringify(safeUser));
      return { success: true };

    } catch {
      // Backend is offline — fall back to demo credentials so dev can still work
      return {
        success: false,
        error:   'Cannot connect to backend. Is the Spring Boot server running on port 8080?',
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('ipos_user');
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
