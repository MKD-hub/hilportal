const mongoose = require("mongoose");

const newSchema = new mongoose.Schema({
  id: String,
  studentName: String,
  courseid: String,
  instructor: String,
  instructorID: String,
  course: String,
  grade: String,
  mid: Number,
  final: Number,
  assessment: Number,
  total: Number,
  file: String,
  batch: String,
  attendance: [
    {
      date: Date,
      status: String, // Assuming status is a string value
    },
  ],
});

module.exports = mongoose.model("grade", newSchema);
