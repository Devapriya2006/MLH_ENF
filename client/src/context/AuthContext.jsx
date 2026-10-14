import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = () =>
    api('/auth/me')
      .then(r => setUser(r.user))
      .catch(() => {
        localStorage.removeItem('cl_token');
        setUser(null);
      });

  useEffect(() => {
    (localStorage.getItem('cl_token') ? refresh() : Promise.resolve()).finally(() => setReady(true));
  }, []);

  const finish = r => {
    localStorage.setItem('cl_token', r.token);
    setUser(r.user);
    return r.user;
  };

  const login = (email, password, role = 'citizen') =>
    api('/auth/login', { method: 'POST', body: { email, password, role } }).then(finish);

  const register = (registrationData) =>
    api('/auth/register', { method: 'POST', body: registrationData }).then(finish);

  const updateProfile = (profileData) =>
    api('/auth/profile', { method: 'PATCH', body: profileData }).then(r => {
      setUser(r.user);
      return r.user;
    });

  const logout = () => {
    localStorage.removeItem('cl_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, ready, login, register, updateProfile, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
