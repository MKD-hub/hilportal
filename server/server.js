const express = require("express");
const cors = require("cors");
const bodyParses = require("body-parser");

const app = express();
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const PORT = 8000 || process.env.PORT;
const mongoose = require("mongoose");
// mongoose.connect(process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.once("open", () => {
  console.log("Connected to MongoDB database");
});
const helmet = require("helmet");
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from this origin
  })
);
app.use(helmet());

app.use(bodyParses.urlencoded({ extended: true }));
app.use(bodyParses.json());
app.use("/sample", (req, res) => {
  res.send("This is the sample route!");
});

app.use("/teacher", require("./router/teacher.router"));
app.use("/admin", require("./router/admin.router"));
app.use("/student", require("./router/student.router"));
app.use("/uploads", require("./router/upload.router"));
app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
