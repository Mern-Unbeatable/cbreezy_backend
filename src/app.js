import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import eventRoutes from "./routes/event.routes.js";
import locationRoutes from "./routes/location.routes.js";
import pricingRoutes from "./routes/pricing.routes.js";
import supportRoutes from "./routes/support.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminUserRoutes from "./routes/admin-user.routes.js";
import adminListingRoutes from "./routes/admin-listing.routes.js";
import adminRevenueRoutes from "./routes/admin-revenue.routes.js";
import adminCategoryRoutes from "./routes/admin-category.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

// Initialize Express app
const app = express();

app.set("trust proxy", true);

// CORS configuration
const allowedOrigins = [
  "*",
  "http://localhost:5173",
  "https://cbreezy.mtscorporate.com",
  "https://cbreezy.maktechgroup.tech",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Keep API publicly accessible for any frontend origin.
      callback(null, true);
    },
    credentials: true,
  }),
);

// Keep popup-based auth flows (e.g., Firebase Google sign-in) compatible.
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// root route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});
// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SideGurus API Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/pricing-plans", pricingRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/listings", adminListingRoutes);
app.use("/api/admin/revenue", adminRevenueRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);

// 404 handler - catch all undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
