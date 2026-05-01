import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { setConnection } from "../store/quickbooksSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export default function Login() {
  const dispatch = useAppDispatch();
  const { connected } = useAppSelector((s) => s.quickbooks);
  const [searchParams] = useSearchParams();
  const urlError = searchParams.get("error");
  const oauthCallbackError = urlError
    ? decodeURIComponent(urlError)
    : null;
  const [checking, setChecking] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadStatus() {
      setChecking(true);
      setStatusError(null);
      const res = await api.get("/api/auth/status");
      if (ignore) return;

      if (!res.ok) {
        setStatusError(res.data?.error || `Server error (${res.status})`);
        dispatch(
          setConnection({ connected: false, connection: null })
        );
        setChecking(false);
        return;
      }

      if (res.data && res.data.success === false) {
        setStatusError(res.data.error || "Status check failed");
        dispatch(
          setConnection({ connected: false, connection: null })
        );
        setChecking(false);
        return;
      }

      dispatch(
        setConnection({
          connected: Boolean(res.data?.connected),
          connection: res.data?.data ?? null,
        })
      );
      setChecking(false);
    }

    void loadStatus();
    return () => {
      ignore = true;
    };
  }, [dispatch]);

  async function startQuickBooksLogin() {
    setBusy(true);
    setActionError(null);
    const res = await api.get("/api/auth/connect");
    setBusy(false);

    if (!res.ok || !res.data?.success || !res.data?.data?.authUrl) {
      setActionError(res.data?.error || "Could not start QuickBooks login");
      return;
    }

    window.location.href = res.data.data.authUrl;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-md">
        <h1 className="text-center text-xl font-semibold text-zinc-900">
          QuickBooks link
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Connect this workspace to your QuickBooks company to sync customers
          and invoices.
        </p>

        {(actionError || oauthCallbackError || statusError) && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {actionError || oauthCallbackError || statusError}
          </p>
        )}

        <div className="mt-8 flex justify-center">
          {checking ? (
            <p className="text-sm text-zinc-500">Checking connection…</p>
          ) : connected ? (
            <Link
              to="/home"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Go to home
            </Link>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void startQuickBooksLogin()}
              className="inline-flex items-center justify-center rounded-lg bg-[#2ca01c] px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-[#248016] focus:outline-none focus:ring-2 focus:ring-[#2ca01c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Redirecting…" : "Login with QuickBooks"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
