import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo(
    () => ({
      user,
      login: (payload) => {
        setUser(payload.user);
        localStorage.setItem('admin_token', payload.token);
        localStorage.setItem('admin_user', JSON.stringify(payload.user));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      },
      updateUser: (nextUser) => {
        setUser(nextUser);
        localStorage.setItem('admin_user', JSON.stringify(nextUser));
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
