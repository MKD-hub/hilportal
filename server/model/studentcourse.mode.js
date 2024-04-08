const mongoose = require("mongoose");

const newSchema = new mongoose.Schema({
  id: String,
  courseid: String,
  courseName: String,
  year: Number,
  instructor: String,
  credithour: Number,
  status: Boolean,
});

module.exports = mongoose.model("studentcourse", newSchema);
