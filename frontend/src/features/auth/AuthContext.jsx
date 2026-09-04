import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "./authService";

const AuthContext =
  createContext(null);

const TOKEN_KEY =
  "aurumdesk_auth_token";

export function AuthProvider({
  children,
}) {
  const [token, setToken] =
    useState(() =>
      localStorage.getItem(
        TOKEN_KEY
      )
    );

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | Restore login after browser refresh
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function restoreSession() {
      const savedToken =
        localStorage.getItem(
          TOKEN_KEY
        );

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await getCurrentUser(
            savedToken
          );

        setToken(savedToken);
        setUser(response.user);
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );

        localStorage.removeItem(
          TOKEN_KEY
        );

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  async function login(
    email,
    password
  ) {
    const response =
      await loginUser(
        email,
        password
      );

    localStorage.setItem(
      TOKEN_KEY,
      response.token
    );

    setToken(response.token);
    setUser(response.user);

    return response.user;
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  async function logout() {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.error(
        "Logout API error:",
        error
      );
    } finally {
      localStorage.removeItem(
        TOKEN_KEY
      );

      setToken(null);
      setUser(null);
    }
  }

  const value = {
    token,
    user,
    loading,

    isAuthenticated:
      Boolean(
        token &&
        user
      ),

    login,
    logout,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;
