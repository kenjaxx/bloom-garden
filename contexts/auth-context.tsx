import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/firebaseConfig";

type AuthContextValue = {
  user: User | null;
  // True until the very first onAuthStateChanged callback fires. Used to
  // avoid flashing the login screen (or the app) before Firebase has told
  // us whether a session already exists.
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  initializing: true,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // This is the ONLY onAuthStateChanged subscription in the app. Every
    // screen/guard reads from this context instead of subscribing itself,
    // so there's exactly one source of truth and no race between
    // different listeners resolving at different times.
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}