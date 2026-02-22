import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { setCurrentUser, setFamilyNotFoundCallback } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = loading, false = signed out, object = signed in
  const [user, setUser] = useState(null);
  const [familyNotFound, setFamilyNotFound] = useState(false);

  useEffect(() => {
    setFamilyNotFoundCallback(() => setFamilyNotFound(true));

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setUser(firebaseUser ?? false);
      if (!firebaseUser) setFamilyNotFound(false); // reset on sign-out
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, familyNotFound, setFamilyNotFound }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
