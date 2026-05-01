import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.get("/connect", authController.connect);
router.get("/callback", authController.callback);
router.get("/status", authController.status);
router.post("/logout", authController.logout);

export default router;
