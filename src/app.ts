// Reviewed

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler";
import notFound from "./middleware/notFound";
import apiV1Routes from "./routes/v1";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

const apiPrefix = "/api/v1";

app.use(apiPrefix, apiV1Routes);

app.use(notFound);
app.use(errorHandler);

export default app;
