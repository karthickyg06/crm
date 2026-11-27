import { useEffect, useState } from "react";

import {
  ensureAuthBootstrapped,
  getCurrentUser,
  subscribeAuthStore,
  userCan,
} from "./authStore";
import type { ActionId, AuthUser, ModuleId } from "./types";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void ensureAuthBootstrapped().then(() => {
      if (!mounted) return;
      setUser(getCurrentUser());
      setReady(true);
    });
    const unsubscribe = subscribeAuthStore(() => {
      setUser(getCurrentUser());
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    ready,
    can: (moduleId: ModuleId, action: ActionId = "view") =>
      userCan(user, moduleId, action),
  };
}
