import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
// If using ES modules, define __dirname:
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { log, serveStatic, setupVite } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],

              scriptSrc: [
                "'self'",
                "https://www.gstatic.com",
                "https://www.googleapis.com",
              ],

              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
              ],

              fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "data:",
              ],

              imgSrc: [
                "'self'",
                "data:",
                "https:",
              ],

              connectSrc: [
                "'self'",
                "https://firestore.googleapis.com",
                "https://identitytoolkit.googleapis.com",
                "https://securetoken.googleapis.com",
              ],

              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,

    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware to allow cross-origin requests
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(compression());

// ... existing middleware and logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // (No need to serve payment proofs here again, already done above)

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      // reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      console.log(`Server is running at http://localhost:${port}`);

      // Self-ping to prevent Render free tier cold starts (production only).
      // RENDER_EXTERNAL_URL is automatically injected by Render in deployed environments.
      const renderUrl = process.env.RENDER_EXTERNAL_URL;
      if (app.get("env") === "production" && renderUrl) {
        const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

        setInterval(async () => {
          try {
            const res = await fetch(`${renderUrl}/api/health`);
            console.log(`[self-ping] status: ${res.status} at ${new Date().toISOString()}`);
          } catch (err: any) {
            console.error(`[self-ping] failed: ${err.message}`);
          }
        }, PING_INTERVAL_MS);

        console.log(`[self-ping] enabled — pinging ${renderUrl}/api/health every 14 min`);
      }
    },
  );
})();
