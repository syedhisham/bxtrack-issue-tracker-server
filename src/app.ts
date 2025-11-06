import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// CORS configuration - allow credentials for cookies
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import issueRoutes from "./routes/issue.routes";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/issues", issueRoutes);

export default app;
