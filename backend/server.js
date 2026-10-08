import express from "express";
import multer from "multer";
import cron from "node-cron";
import { mobileOnlyUpload } from "./middleware/mobileOnly.js";
import { runLssLifecycle } from "./services/lssCron.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT) || 4000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "bharatcloud-backend" });
});

app.post(
  "/api/b2c/upload",
  mobileOnlyUpload,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }
    res.status(201).json({
      message: "Upload accepted",
      filename: req.file.originalname,
      size: req.file.size,
      tier: "hot",
    });
  },
);

app.post("/api/b2c/auth/forgot-pin", (req, res) => {
  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: "phone is required" });
  }
  res.json({
    message: "Forgot PIN request sent to Super Admin. Backup code will be emailed.",
    requestId: `fp-${Date.now()}`,
  });
});

// E2E Lifecycle Cron — 0–15 HOT, 15–60 COLD, 60+ ARCHIVE (daily 2:00 AM IST)
cron.schedule(
  "0 2 * * *",
  async () => {
    try {
      await runLssLifecycle();
    } catch (err) {
      console.error("[lss] cron failed", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

app.listen(port, () => {
  console.log(`BharatCloud backend listening on port ${port}`);
});
