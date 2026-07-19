import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";
import { errorMiddleware } from "./middleware/error";

/** Builds the Express app (kept separate from server.ts so tests can import it). */
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
      credentials: true, // allow the HttpOnly session cookie across origins
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });

  app.use("/api", routes);

  // Error handler must be registered last.
  app.use(errorMiddleware);

  return app;
}
