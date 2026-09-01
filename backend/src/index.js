import "dotenv/config";
import cors from "cors";
import express from "express";

import apiRouter from "./routes/api.js";
import webhookRouter from "./routes/webhook.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Webhook de WhatsApp Cloud API (verificación GET + mensajes entrantes POST)
app.use("/webhook", webhookRouter);

// API REST que consume la app web (calendario, cobros, clientes)
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
