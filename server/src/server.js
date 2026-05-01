import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { MONGODB_URI, PORT, CLIENT_URL } from "./config/config.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import authRoutes from "./routes/auth.routes.js";
import quickbookSyncRoutes from "./routes/quickbooksync.routes.js";
import routeNotFount from "./middlewares/routeNotFound.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Database connection
await mongoose.connect(MONGODB_URI);
console.log("Mongodb Database Connected!");


// routes
app.get("/health", (req, res) => {
  res.json({ ok: true });
});
app.use("/api/auth", authRoutes);
app.use("/api/sync", quickbookSyncRoutes);


// Handle 404 Route
app.use(routeNotFount);
// hanle globle error
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
