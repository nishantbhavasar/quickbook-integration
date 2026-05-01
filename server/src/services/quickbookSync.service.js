import axios from "axios";
import Customer from "../models/Customer.model.js";
import Invoice from "../models/Invoice.model.js";
import { QB_API_BASE } from "../config/config.js";
import { getValidAccessTokenRow } from "./auth.services.js";

const MINOR = 65;
const QB_PAGE = 500;

function pageAndLimit(query) {
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const rawLimit = parseInt(String(query.limit || "10"), 10);
  const limit = Math.min(100, Math.max(1, rawLimit || 10));
  return { page, limit };
}

async function newestLastUpdated(Model) {
  const doc = await Model.findOne().sort({ _id: -1 }).lean();
  if (!doc?.lastUpdated) return new Date(0);
  return new Date(doc.lastUpdated);
}

async function loadAllFromQuickBooks(accessToken, realmId, entityName, since) {
  const useSince = since instanceof Date && since.getTime() > 0;
  const rows = [];
  let start = 1;

  while (true) {
    let sql = `select * from ${entityName}`;
    if (useSince) {
      sql += ` where Metadata.LastUpdatedTime > '${since.toISOString()}'`;
    }
    sql += ` STARTPOSITION ${start} MAXRESULTS ${QB_PAGE}`;

    const requestUrl = `${QB_API_BASE}/v3/company/${realmId}/query?query=${encodeURIComponent(
      sql
    )}&minorversion=${MINOR}`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };
    if (useSince) {
      headers["If-Modified-Since"] = since.toUTCString();
    }

    const { data } = await axios.get(requestUrl, {
      headers,
      validateStatus: () => true,
    });

    if (data.Fault) {
      const first = data.Fault?.Error?.[0];
      const err = new Error(first?.Message || first?.Detail || "QuickBooks error");
      err.status = 502;
      throw err;
    }

    const block = data.QueryResponse?.[entityName];
    const batch = Array.isArray(block) ? block : block ? [block] : [];
    if (batch.length === 0) break;

    rows.push(...batch);
    if (batch.length < QB_PAGE) break;
    start += QB_PAGE;
  }

  return rows;
}

export async function listCustomersPaginated(query) {
  const { page, limit } = pageAndLimit(query);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Customer.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(),
  ]);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function listInvoicesPaginated(query) {
  const { page, limit } = pageAndLimit(query);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Invoice.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(),
  ]);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function syncCustomersFull() {
  const { accessToken, companyId } = await getValidAccessTokenRow();
  const remote = await loadAllFromQuickBooks(
    accessToken,
    companyId,
    "Customer",
    null
  );

  let synced = 0;
  for (const c of remote) {
    const last = c.MetaData?.LastUpdatedTime
      ? new Date(c.MetaData.LastUpdatedTime)
      : new Date();
    const doc = {
      customerId: String(c.Id),
      name: c.DisplayName || c.CompanyName || "",
      email: c.PrimaryEmailAddr?.Address || "",
      lastUpdated: last,
    };
    await Customer.findOneAndUpdate({ customerId: doc.customerId }, doc, {
      upsert: true,
    });
    synced += 1;
  }
  return { synced };
}

export async function syncCustomersDelta() {
  const { accessToken, companyId } = await getValidAccessTokenRow();
  const since = await newestLastUpdated(Customer);
  const remote = await loadAllFromQuickBooks(
    accessToken,
    companyId,
    "Customer",
    since
  );

  let synced = 0;
  for (const c of remote) {
    const last = c.MetaData?.LastUpdatedTime
      ? new Date(c.MetaData.LastUpdatedTime)
      : new Date();
    const doc = {
      customerId: String(c.Id),
      name: c.DisplayName || c.CompanyName || "",
      email: c.PrimaryEmailAddr?.Address || "",
      lastUpdated: last,
    };
    await Customer.findOneAndUpdate({ customerId: doc.customerId }, doc, {
      upsert: true,
    });
    synced += 1;
  }

  const usedFilter = since.getTime() > 0;
  return {
    synced,
    sinceUsed: usedFilter ? since.toISOString() : null,
  };
}

export async function syncInvoicesFull() {
  const { accessToken, companyId } = await getValidAccessTokenRow();
  const remote = await loadAllFromQuickBooks(
    accessToken,
    companyId,
    "Invoice",
    null
  );

  let synced = 0;
  for (const inv of remote) {
    const last = inv.MetaData?.LastUpdatedTime
      ? new Date(inv.MetaData.LastUpdatedTime)
      : new Date();
    const totalAmt = Number(inv.TotalAmt) || 0;
    const balance = Number(inv.Balance);
    const paid = balance === 0 && totalAmt > 0;
    const doc = {
      invoiceId: String(inv.Id),
      customerId: inv.CustomerRef?.value ? String(inv.CustomerRef.value) : "",
      amount: totalAmt,
      status: paid ? "Paid" : "Open",
      invoiceDate: inv.TxnDate ? new Date(inv.TxnDate) : new Date(),
      lastUpdated: last,
    };
    await Invoice.findOneAndUpdate({ invoiceId: doc.invoiceId }, doc, {
      upsert: true,
    });
    synced += 1;
  }
  return { synced };
}

export async function syncInvoicesDelta() {
  const { accessToken, companyId } = await getValidAccessTokenRow();
  const since = await newestLastUpdated(Invoice);
  const remote = await loadAllFromQuickBooks(
    accessToken,
    companyId,
    "Invoice",
    since
  );

  let synced = 0;
  for (const inv of remote) {
    const last = inv.MetaData?.LastUpdatedTime
      ? new Date(inv.MetaData.LastUpdatedTime)
      : new Date();
    const totalAmt = Number(inv.TotalAmt) || 0;
    const balance = Number(inv.Balance);
    const paid = balance === 0 && totalAmt > 0;
    const doc = {
      invoiceId: String(inv.Id),
      customerId: inv.CustomerRef?.value ? String(inv.CustomerRef.value) : "",
      amount: totalAmt,
      status: paid ? "Paid" : "Open",
      invoiceDate: inv.TxnDate ? new Date(inv.TxnDate) : new Date(),
      lastUpdated: last,
    };
    await Invoice.findOneAndUpdate({ invoiceId: doc.invoiceId }, doc, {
      upsert: true,
    });
    synced += 1;
  }

  const usedFilter = since.getTime() > 0;
  return {
    synced,
    sinceUsed: usedFilter ? since.toISOString() : null,
  };
}
