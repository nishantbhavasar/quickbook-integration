import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { api } from "../lib/api";
import { setConnection, resetQuickbooks } from "../store/quickbooksSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

type TabKey = "customers" | "invoices";

function formatDate(value: string | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { connected, connection } = useAppSelector((s) => s.quickbooks);
  const [checkingSession, setCheckingSession] = useState(true);
  const [tab, setTab] = useState<TabKey>("customers");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [rowsCustomers, setRowsCustomers] = useState<any[]>([]);
  const [rowsInvoices, setRowsInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadStatus() {
      setCheckingSession(true);
      const res = await api.get("/api/auth/status");
      if (ignore) return;

      if (!res.ok || (res.data && res.data.success === false)) {
        dispatch(
          setConnection({ connected: false, connection: null })
        );
        setCheckingSession(false);
        navigate("/login", { replace: true });
        return;
      }

      const isConnected = Boolean(res.data?.connected);
      dispatch(
        setConnection({
          connected: isConnected,
          connection: res.data?.data ?? null,
        })
      );
      setCheckingSession(false);
      if (!isConnected) {
        navigate("/login", { replace: true });
      }
    }

    void loadStatus();
    return () => {
      ignore = true;
    };
  }, [dispatch, navigate]);

  const loadCustomers = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await api.get(`/api/sync/customers?${q}`);
    if (!res.ok || res.data?.success === false) {
      setListError(res.data?.error || "Failed to load customers");
      setListLoading(false);
      return;
    }
    setRowsCustomers(res.data.data ?? []);
    setPagination(res.data.pagination);
    setListLoading(false);
  }, [page]);

  const loadInvoices = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await api.get(`/api/sync/invoices?${q}`);
    if (!res.ok || res.data?.success === false) {
      setListError(res.data?.error || "Failed to load invoices");
      setListLoading(false);
      return;
    }
    setRowsInvoices(res.data.data ?? []);
    setPagination(res.data.pagination);
    setListLoading(false);
  }, [page]);

  useEffect(() => {
    if (checkingSession || !connected) return;
    if (tab === "customers") void loadCustomers();
    else void loadInvoices();
  }, [tab, page, connected, checkingSession, loadCustomers, loadInvoices]);

  async function runSync(path: string) {
    setSyncBusy(true);
    setSyncMessage(null);
    const res = await api.post(path, {});
    setSyncBusy(false);

    if (!res.ok || res.data?.success === false) {
      setSyncMessage(res.data?.error || "Sync failed");
      return;
    }

    const payload = res.data?.data;
    if (payload && typeof payload.synced === "number") {
      const extra =
        payload.sinceUsed == null ? "" : ` (since ${payload.sinceUsed})`;
      setSyncMessage(`Finished sync. Rows updated: ${payload.synced}${extra}.`);
    } else {
      setSyncMessage("Sync completed.");
    }

    if (tab === "customers") await loadCustomers();
    else await loadInvoices();
  }

  async function logout() {
    await api.post("/api/auth/logout", {});
    dispatch(resetQuickbooks());
    navigate("/login", { replace: true });
  }

  const customerColumns = useMemo<ColumnDef<any, any>[]>(
    () => [
      { header: "Customer ID", accessorKey: "customerId" },
      { header: "Name", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      {
        header: "Last updated",
        accessorKey: "lastUpdated",
        cell: (ctx) => formatDate(ctx.getValue() as string),
      },
    ],
    []
  );

  const invoiceColumns = useMemo<ColumnDef<any, any>[]>(
    () => [
      { header: "Invoice ID", accessorKey: "invoiceId" },
      { header: "Customer ID", accessorKey: "customerId" },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: (ctx) => {
          const n = Number(ctx.getValue());
          return Number.isFinite(n) ? n.toFixed(2) : "—";
        },
      },
      { header: "Status", accessorKey: "status" },
      {
        header: "Invoice date",
        accessorKey: "invoiceDate",
        cell: (ctx) => formatDate(ctx.getValue() as string),
      },
      {
        header: "Last updated",
        accessorKey: "lastUpdated",
        cell: (ctx) => formatDate(ctx.getValue() as string),
      },
    ],
    []
  );

  if (checkingSession || !connected) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-600">
        Loading…
      </div>
    );
  }

  const tabBtn =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const tabActive = "bg-white text-zinc-900 shadow-sm";
  const tabIdle = "text-zinc-600 hover:text-zinc-900";

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/home" className="text-sm font-semibold text-zinc-900">
              QuickBooks workspace
            </Link>
            <nav className="flex gap-1 rounded-lg bg-zinc-200/80 p-1">
              <button
                type="button"
                className={`${tabBtn} ${tab === "customers" ? tabActive : tabIdle}`}
                onClick={() => {
                  setPage(1);
                  setTab("customers");
                }}
              >
                Customers
              </button>
              <button
                type="button"
                className={`${tabBtn} ${tab === "invoices" ? tabActive : tabIdle}`}
                onClick={() => {
                  setPage(1);
                  setTab("invoices");
                }}
              >
                Invoices
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {connection?.companyName && (
              <span className="hidden text-sm text-zinc-600 sm:inline">
                {connection.companyName}
              </span>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncBusy}
            onClick={() =>
              void runSync(
                tab === "customers"
                  ? "/api/sync/customers/sync-full"
                  : "/api/sync/invoices/sync-full"
              )
            }
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Full sync
          </button>
          <button
            type="button"
            disabled={syncBusy}
            onClick={() =>
              void runSync(
                tab === "customers"
                  ? "/api/sync/customers/sync-delta"
                  : "/api/sync/invoices/sync-delta"
              )
            }
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            Delta sync
          </button>
        </div>

        {syncMessage && (
          <p className="mb-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
            {syncMessage}
          </p>
        )}
        {listError && (
          <p className="mb-3 text-sm text-red-700">{listError}</p>
        )}

        {tab === "customers" ? (
          <>
            <DataTable
              data={rowsCustomers}
              columns={customerColumns}
              emptyLabel="No customers in the database yet. Run a full sync."
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
              disabled={listLoading}
            />
          </>
        ) : (
          <>
            <DataTable
              data={rowsInvoices}
              columns={invoiceColumns}
              emptyLabel="No invoices in the database yet. Run a full sync."
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
              disabled={listLoading}
            />
          </>
        )}
      </main>
    </div>
  );
}
