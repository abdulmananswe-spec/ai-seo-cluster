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

app.use((req, res, next) => {
  // If request has already been parsed by Vercel, skip express.json()
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      req.rawBody = JSON.stringify(req.body);
    }
    return next();
  }
  
  // Otherwise, use standard express JSON parsing
  express.json()(req, res, (err) => {
    if (err) return next(err);
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      req.rawBody = JSON.stringify(req.body);
    }
    express.urlencoded({ extended: false })(req, res, next);
  });
});

export function log(message: string, source = "express") {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [${source}] ${message}`);
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

  // register routes
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
