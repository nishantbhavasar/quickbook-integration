import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const PORT = Number(process.env.PORT || 5000);
export const MONGODB_URI = required("MONGODB_URI");
export const QB_CLIENT_ID = required("QB_CLIENT_ID");
export const QB_CLIENT_SECRET = required("QB_CLIENT_SECRET");
export const QB_REDIRECT_URI = required("QB_REDIRECT_URI");
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const QB_API_BASE = process.env.QB_API_BASE;

export const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
export const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
export const SCOPE = "com.intuit.quickbooks.accounting";
export const MINOR = 65;
export const STATE_MAX_AGE_MS = 15 * 60 * 1000;