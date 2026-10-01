import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/logging.middleware";
import { helmetMiddleware, corsMiddleware, generalRateLimiter } from "./middleware/security.middleware";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

// ── Import passport configuration ────────────────────────────────────
import "./config/passport.config";
const app = express();
// ── Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [env.CORS_ORIGIN,
  // your Vercel site
  "http://localhost", "capacitor://localhost", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// ── Initialize Passport ──────────────────────────────────────────────
app.use(passport.initialize());

// ── Logging & Security ───────────────────────────────────────────────
app.use(requestLogger);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalRateLimiter);

// ── Swagger Documentation ────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ───────────────────────────────────────────────────────────
app.use("/api", routes);

// ── Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────
const PORT = env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
export default app;