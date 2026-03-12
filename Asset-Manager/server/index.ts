import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

export const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Re-add raw body for verification if needed
app.use((req, _res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    req.rawBody = JSON.stringify(req.body);
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
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

      log(logLine);
    }
  });

  next();
});

export const initApp = async () => {
  // Only seed if not on Vercel or explicitly asked
  if (!process.env.VERCEL) {
    const { seedDatabase } = await import("./seed");
    await seedDatabase().catch((err) => console.error("Seed error:", err));
  } else {
    log("Running on Vercel, skipping database seeding to save execution time.");
  }

  // Test DB connection
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    log("Database connection successful.");
  } catch (err: any) {
    console.error("Database connection failed:", err);
    if (process.env.VERCEL) {
      throw new Error(`Database connection failed: ${err.message}. Ensure POSTGRES_URL is correct.`);
    }
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  return httpServer;
};

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  (async () => {
    const server = await initApp();
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(
      {
        port,
        host: "127.0.0.1"
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  })();
}
