import { Router } from "express";
import * as syncController from "../controllers/quickbooksync.controller.js";

const router = Router();

router.get("/customers", syncController.listCustomers);
router.get("/invoices", syncController.listInvoices);
router.post("/customers/sync-full", syncController.customersSyncFull);
router.post("/customers/sync-delta", syncController.customersSyncDelta);
router.post("/invoices/sync-full", syncController.invoicesSyncFull);
router.post("/invoices/sync-delta", syncController.invoicesSyncDelta);

export default router;
