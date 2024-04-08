const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(
    path.resolve(__dirname, ".."),
    "uploads",
    "files",
    filename
  );
  res.sendFile(filePath);
});

router.get("/generate/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(
    path.resolve(__dirname, ".."),
    "uploads",
    "generate",
    filename
  );
  res.sendFile(filePath);
});
router.get("/attendance/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(
    path.resolve(__dirname, ".."),
    "uploads",
    "attendance",
    filename
  );
  res.sendFile(filePath);
});

router.get("/material/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(
    path.resolve(__dirname, ".."),
    "uploads",
    "material",
    filename
  );
  res.sendFile(filePath);
});
router.get("/payments/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(
    path.resolve(__dirname, ".."),
    "uploads",
    "payments",
    filename
  );
  res.sendFile(filePath);
});
router.get("/transcript/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(
    path.resolve(__dirname, ".."),
    "uploads",
    "transcript",
    filename
  );
  res.sendFile(filePath);
});

module.exports = router;
