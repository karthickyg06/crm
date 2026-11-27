import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/crm/shared";
import {
  ensureAuthBootstrapped,
  firstAuthorizedPath,
  loginWithPassword,
} from "@/features/auth/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setBusy(true);
    try {
      await ensureAuthBootstrapped();
      const user = await loginWithPassword(email, password);
      toast(`Welcome back, ${user.name}.`);
      void navigate({ to: firstAuthorizedPath(user) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#F5F8FF_0%,#EEF4FF_42%,#FFFFFF_100%)] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#5685DD]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#2F6BFF]/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card/95 p-8 shadow-[0_20px_60px_-24px_rgba(47,107,255,0.45)] backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#EAF0FF] text-sm font-bold tracking-tight text-[#2F6BFF]">
            YG
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Yaglob CRM
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your workspace
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Email address" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-xl pl-9"
                placeholder="name@company.com"
                required
              />
            </div>
          </FormField>

          <FormField label="Password" required>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl pl-9 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl bg-[#2F6BFF] text-sm font-semibold text-white hover:bg-[#2558d9]"
          >
            {busy ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          Demo authentication for local presentation only. Not production
          security. Credentials are verified with PBKDF2 in the browser and
          stored locally.
        </p>
      </div>
    </div>
  );
}
