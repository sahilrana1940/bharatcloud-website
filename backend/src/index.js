import express from "express";
import multer from "multer";
import { mobileOnlyUpload } from "./middleware/mobileOnlyUpload.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT) || 4000;

app.get("/health", (_req, res) => {
  res.json({ ok: true });
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
    });
  },
);

app.listen(port, () => {
  console.log(`BharatCloud backend listening on port ${port}`);
});
