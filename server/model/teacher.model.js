const mongoose = require("mongoose");

const newSchema = new mongoose.Schema({
  id: String,
  name: String,
  gender: String,
  email: String,
  password: String,
  phone: Number,
  restricted: {
    type: Boolean,
    default: true,
  },
  curriculumVitae: String,
  qualifications: String,
  certifications: String,
  interviewDate: Date,
  assignedCourses: [String],
  batch: [String],
  role: String,
  changeRequests: [
    {
      course: String,
      requestId: String,
      sender: String,
      message: String,
      grade:String,
      mid: Number,
      final: Number,
      assessment: Number,
      approved: {
        type: Boolean,
        default: false,
      },
      time: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
module.exports = mongoose.model("teacher", newSchema);
