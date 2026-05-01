import crypto from "node:crypto";
import axios from "axios";
import QuickbooksToken from "../models/QuickbooksToken.model.js";
import Customer from "../models/Customer.model.js";
import Invoice from "../models/Invoice.model.js";
import {
  QB_CLIENT_ID,
  QB_CLIENT_SECRET,
  QB_REDIRECT_URI,
  QB_API_BASE,
  AUTH_URL,
  TOKEN_URL,
  SCOPE,
  MINOR,
  STATE_MAX_AGE_MS,
} from "../config/config.js";

export function verifyOAuthState(state) {
  if (!state || typeof state !== "string") return false;
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const issuedStr = parts[0];
  const nonce = parts[1];
  const sig = parts[2];
  const issued = Number(issuedStr);
  if (!Number.isFinite(issued) || Date.now() - issued > STATE_MAX_AGE_MS) {
    return false;
  }
  const payload = `${issuedStr}.${nonce}`;
  const expected = crypto
    .createHmac("sha256", QB_CLIENT_SECRET)
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function getConnectResponse() {
  const issued = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${issued}.${nonce}`;
  const sig = crypto
    .createHmac("sha256", QB_CLIENT_SECRET)
    .update(payload)
    .digest("base64url");
  const state = `${payload}.${sig}`;
  const params = new URLSearchParams({
    client_id: QB_CLIENT_ID,
    redirect_uri: QB_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    state,
  });
  return { authUrl: `${AUTH_URL}?${params.toString()}` };
}

function authHeaderForTokenEndpoint() {
  const pair = `${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(pair, "utf8").toString("base64")}`;
}

export async function exchangeAuthorizationCode(code, realmId) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: QB_REDIRECT_URI,
  });

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    headers: {
      Authorization: authHeaderForTokenEndpoint(),
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    validateStatus: () => true,
  });

  if (!data.access_token) {
    const err = new Error(
      data.error_description || data.error || "Token exchange failed"
    );
    err.status = 400;
    throw err;
  }

  const expiresInSec = data.expires_in || 3600;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    companyId: realmId,
    expiresIn: new Date(Date.now() + expiresInSec * 1000),
  };
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    headers: {
      Authorization: authHeaderForTokenEndpoint(),
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    validateStatus: () => true,
  });

  if (!data.access_token) {
    const err = new Error(
      data.error_description || data.error || "Token refresh failed"
    );
    err.status = 401;
    throw err;
  }

  const expiresInSec = data.expires_in || 3600;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: new Date(Date.now() + expiresInSec * 1000),
  };
}

export async function saveTokenRecord(payload) {
  await QuickbooksToken.deleteMany({});
  await QuickbooksToken.create({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    companyId: payload.companyId,
    expiresIn: payload.expiresIn,
    companyName: payload.companyName || undefined,
  });
}

export async function persistOAuthSession({ code, realmId }) {
  const tokens = await exchangeAuthorizationCode(code, realmId);

  let companyName = null;
  try {
    const infoUrl = `${QB_API_BASE}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=${MINOR}`;
    const { data } = await axios.get(infoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/json",
      },
      validateStatus: () => true,
    });
    companyName = data?.CompanyInfo?.CompanyName || null;
  } catch {
    companyName = null;
  }

  await saveTokenRecord({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    companyId: tokens.companyId,
    expiresIn: tokens.expiresIn,
    companyName,
  });

  return {
    companyId: realmId,
    expiresIn: tokens.expiresIn,
    companyName,
  };
}

export async function getValidAccessTokenRow() {
  const row = await QuickbooksToken.findOne();
  if (!row) {
    const err = new Error("QuickBooks is not connected");
    err.status = 401;
    throw err;
  }

  const stillFresh =
    row.expiresIn && row.expiresIn.getTime() > Date.now() + 120 * 1000;
  if (stillFresh) {
    return { accessToken: row.accessToken, companyId: row.companyId };
  }

  if (!row.refreshToken) {
    const err = new Error("Missing refresh token — connect QuickBooks again");
    err.status = 401;
    throw err;
  }

  const next = await refreshAccessToken(row.refreshToken);
  row.accessToken = next.accessToken;
  row.refreshToken = next.refreshToken;
  row.expiresIn = next.expiresIn;
  await row.save();

  return { accessToken: row.accessToken, companyId: row.companyId };
}

export async function getConnectionStatus() {
  const row = await QuickbooksToken.findOne().lean();
  if (!row) {
    return { connected: false, data: null };
  }
  return {
    connected: true,
    data: {
      companyId: row.companyId,
      expiresIn: row.expiresIn,
      companyName: row.companyName || null,
    },
  };
}

export async function logoutUser() {
  await QuickbooksToken.deleteMany({});
  await Customer.deleteMany({});
  await Invoice.deleteMany({});
}
