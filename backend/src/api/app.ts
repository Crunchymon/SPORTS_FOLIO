import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { authRouter } from "./routes/auth.routes";
import { walletRouter } from "./routes/wallet.routes";
import { tradeRouter } from "./routes/trade.routes";
import { athleteRouter } from "./routes/athlete.routes";
import { portfolioRouter } from "./routes/portfolio.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const openApiPath = path.join(process.cwd(), "docs", "openapi.yaml");
if (fs.existsSync(openApiPath)) {
  const openApiDoc = YAML.load(openApiPath);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));
}

app.use("/auth", authRouter);
app.use("/wallet", walletRouter);
app.use("/trade", tradeRouter);
app.use("/athletes", athleteRouter);
app.use("/portfolio", portfolioRouter);

app.use(notFoundHandler);
app.use(errorHandler);
