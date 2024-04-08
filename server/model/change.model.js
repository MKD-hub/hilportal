const mongoose = require("mongoose");

const newSchema = new mongoose.Schema({
  id: String,
  studentName: String,
  courseid: String,
  reason: String,
});

module.exports = mongoose.model("change", newSchema);
