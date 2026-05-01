import { CLIENT_URL } from "../config/config.js";
import {
  getConnectResponse,
  persistOAuthSession,
  getConnectionStatus,
  logoutUser,
  verifyOAuthState,
} from "../services/auth.services.js";
import asyncHandler from "../utils/asyncHandler.js";

function redirectLoginError(res, message) {
  const q = new URLSearchParams({ error: message });
  res.redirect(`${CLIENT_URL}/login?${q.toString()}`);
}

export const connect = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: getConnectResponse(),
    error: null,
  });
});

export const callback = asyncHandler(async (req, res) => {
  const {
    code,
    state,
    realmId: realmIdRaw,
    realmid,
    error,
    error_description: errorDescription,
  } = req.query;

  if (error) {
    redirectLoginError(res, String(errorDescription || error));
    return;
  }

  if (!verifyOAuthState(state)) {
    redirectLoginError(res, "Invalid or expired OAuth state");
    return;
  }

  const realmId = realmIdRaw || realmid;
  if (!code || !realmId) {
    redirectLoginError(res, "Missing authorization code or realm");
    return;
  }

  try {
    await persistOAuthSession({ code, realmId: String(realmId).trim() });
  } catch (e) {
    redirectLoginError(res, e.message || "OAuth failed");
    return;
  }

  res.redirect(`${CLIENT_URL}/home`);
});

export const status = asyncHandler(async (req, res) => {
  const body = await getConnectionStatus();
  res.json({
    success: true,
    connected: body.connected,
    data: body.data,
    error: null,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser();
  res.json({ success: true, data: { cleared: true }, error: null });
});
