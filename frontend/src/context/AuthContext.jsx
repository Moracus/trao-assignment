import { createContext, useContext, useEffect, useState } from "react";
import * as auth from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (credentials) => {
    const { data } = await auth.login(credentials);
    setUser(data);
  };

  const signOut = async () => {
    await auth.logout();
    setUser(null);
  };

  const signup = async (data)=>{
    await auth.signup(data)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut ,signup}}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);