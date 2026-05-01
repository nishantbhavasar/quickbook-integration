import asyncHandler from "../utils/asyncHandler.js";
import {
  listCustomersPaginated,
  listInvoicesPaginated,
  syncCustomersFull,
  syncCustomersDelta,
  syncInvoicesFull,
  syncInvoicesDelta,
} from "../services/quickbookSync.service.js";

export const listCustomers = asyncHandler(async (req, res) => {
  const result = await listCustomersPaginated(req.query);
  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    error: null,
  });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const result = await listInvoicesPaginated(req.query);
  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    error: null,
  });
});

export const customersSyncFull = asyncHandler(async (req, res) => {
  const data = await syncCustomersFull();
  res.json({ success: true, data, error: null });
});

export const customersSyncDelta = asyncHandler(async (req, res) => {
  const data = await syncCustomersDelta();
  res.json({ success: true, data, error: null });
});

export const invoicesSyncFull = asyncHandler(async (req, res) => {
  const data = await syncInvoicesFull();
  res.json({ success: true, data, error: null });
});

export const invoicesSyncDelta = asyncHandler(async (req, res) => {
  const data = await syncInvoicesDelta();
  res.json({ success: true, data, error: null });
});
