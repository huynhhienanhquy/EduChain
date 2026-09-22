import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('student_user');
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo(
    () => ({
      user,
      login: (payload) => {
        setUser(payload.user);
        localStorage.setItem('student_token', payload.token);
        localStorage.setItem('student_user', JSON.stringify(payload.user));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
      },
      updateUser: (nextUser) => {
        setUser(nextUser);
        localStorage.setItem('student_user', JSON.stringify(nextUser));
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
