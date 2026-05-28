import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import { createServer } from "http";
import { connectDB } from "./config/connection.js";
import { initSocketServer } from "./ws/server.js";
import authRoutes from "./routes/auth.js";
import dbRoutes from "./routes/db.js";
import inviteRoutes from "./routes/invites.js";
import setupRoutes from "./routes/setup.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const PORT = process.env.PORT as string;

app.use(cors({
  origin: process.env.FRONTEND_URL as string,
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/db", dbRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  connectDB().then(() => {
    console.log("MongoDB connected");
  }).catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
});
