const express = require("express");
const teacherModel = require("../model/teacher.model");
const studentModel = require("../model/student.model");
const materialModel = require("../model/material.model");
const router = express.Router();
const gradeModel = require("../model/grade.model");
const path = require("path");
const xlsx = require("xlsx");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");

function generateID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "TR" + "";

  // Generate two random letters
  for (let i = 0; i < 2; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate four random numbers
  for (let i = 0; i < 4; i++) {
    id += Math.floor(Math.random() * 10);
  }

  return id;
}
router.get("/response", (req, res) => {
  res.status(200).json({ reponse: "Responds Perfectly" });
});

// Define storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/teacher"); // Save uploaded files to the 'uploads/teacher' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

// Initialize multer upload with defined storage
const upload = multer({ storage: storage });

router.post(
  "/register",
  upload.fields([
    { name: "curriculumVitae", maxCount: 1 },
    { name: "qualifications", maxCount: 1 },
    { name: "certifications", maxCount: 1 },
  ]),
  (req, res) => {
    // Check if the provided email already exists
    teacherModel
      .findOne({ email: req.body.email })
      .then((existingEmail) => {
        if (existingEmail) {
          // Email already exists
          return res.status(409).json({ error: "Email already exists" });
        } else {
          // Check if the provided ID already exists
          teacherModel
            .findOne({ id: generateID() })
            .then((existingID) => {
              if (existingID) {
                // ID already exists
                return res.status(409).json({ error: "ID already exists" });
              } else {
                // Both email and ID are unique, perform file upload
                // Retrieve uploaded files
                const uploadedCV = req.files["curriculumVitae"][0];
                const uploadedQualifications = req.files["qualifications"][0];
                const uploadedCertifications = req.files["certifications"][0];

                // Create and save the new teacher
                const newTeacher = new teacherModel({
                  id: generateID(), // Use provided ID
                  name: req.body.name,
                  gender: req.body.gender,
                  email: req.body.email,
                  role: "Teacher",
                  phone: req.body.phone,
                  curriculumVitae: uploadedCV ? uploadedCV.filename : null,
                  qualifications: uploadedQualifications
                    ? uploadedQualifications.filename
                    : null,
                  certifications: uploadedCertifications
                    ? uploadedCertifications.filename
                    : null,
                  interviewDate: req.body.interviewDate,
                });

                newTeacher
                  .save()
                  .then((savedTeacher) => {
                    res.status(201).json(savedTeacher);
                  })
                  .catch((err) => {
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                  });
              }
            })
            .catch((err) => {
              console.error(err);
              res.status(500).json({ error: "Internal server error" });
            });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      });
  }
);

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log("File name:", fileName); // Log the file name

    // Extract instructor name, course name, and batch from the file name
    const fileNameParts = fileName.split("-");
    console.log("File name parts:", fileNameParts); // Log the file name parts

    if (fileNameParts.length !== 3 || !fileName.endsWith(".xlsx")) {
      return res.status(400).json({ error: "Invalid file name format" });
    }

    const instructorName = fileNameParts[0].trim();
    const course = fileNameParts[1].trim();
    const batch = fileNameParts[2].trim().split(".")[0];

    // Find the instructor in the teacher model to get instructor ID
    const instructor = await teacherModel.findOne({ name: instructorName });
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    const instructorID = instructor.id;

    // Read the uploaded Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Process the data and populate fields accordingly
    const uploadedGrades = [];
    for (const row of data) {
      const { Name, ID, Grade, Mid, Final, Assessment, Total } = row;

      // Populate fields and save to database
      const newGrade = new gradeModel({
        instructor: instructorName,
        instructorID: instructorID, // Add instructor ID obtained from teacher model
        course: course,
        batch: batch,
        studentName: Name,
        id: ID,
        grade: Grade,
        mid: Mid,
        final: Final,
        assessment: Assessment,
        total: Total,
        file: req.file ? req.file.filename : null, // Use req.file.filename to get the file name
      });

      // Save the grade to the database
      const savedGrade = await newGrade.save();
      uploadedGrades.push(savedGrade);
      console.log("Grade uploaded:", row);
    }

    // Delete the uploaded file after processing
    fs.unlinkSync(filePath);

    // Prepare response with added teacherId
    const responseGrades = uploadedGrades.map((grade) => ({
      ...grade.toJSON(),
      teacherId: instructorID,
    }));

    res.status(200).json({
      message: "Excel data uploaded and grades added successfully",
      uploadedGrades: responseGrades,
    });
  } catch (error) {
    console.error("Error uploading file and processing data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sendnotifications", async (req, res) => {
  try {
    const { batch, sender, message } = req.body;

    // Find all students in the specified batch
    const students = await studentModel.find({ batch });

    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found in the specified batch." });
    }

    // Add the notification to each student's notifications array
    for (const student of students) {
      student.notifications.push({ sender, message, time: Date.now() });
      await student.save();
    }

    return res
      .status(200)
      .json({ message: "Notifications sent successfully." });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/signin", (req, res) => {
  teacherModel
    .findOne({
      email: req.body.email,
    })
    .then((data) => {
      if (data) {
        // Check if the user is restricted
        if (data.restricted) {
          return res.status(403).json({ error: "User is restricted." });
        }

        // Hash the provided password
        const hashedPassword = crypto
          .createHash("sha256")
          .update(req.body.password)
          .digest("base64");

        // Compare hashed password
        if (hashedPassword === data.password) {
          console.log(data);
          return res.status(200).json(data);
        } else {
          // Password incorrect
          return res.status(401).json({ error: "Password incorrect." });
        }
      } else {
        // User ID doesn't exist
        return res.status(404).json({ error: "User doesn't exist." });
      }
    })
    .catch((error) => {
      // Handle any other errors
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    });
});

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email already exists
    const existingTeacher = await teacherModel.findOne({ email });

    if (existingTeacher) {
      // Email already exists

      // Check if password is already set for the teacher
      if (existingTeacher.password) {
        // Password is already set, inform the user
        return res
          .status(400)
          .json({ error: "Email already exists. Password cannot be changed." });
      }

      // Hash the provided password and assign it to the existing teacher
      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("base64");

      existingTeacher.password = hashedPassword;
      await existingTeacher.save();

      return res
        .status(200)
        .json({ message: "Password assigned successfully" });
    } else {
      // Email does not exist, create a new teacher

      // Hash the provided password
      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("base64");

      // Create a new teacher
      const newTeacher = new teacherModel({
        email,
        password: hashedPassword,
      });

      // Save the new teacher to the database
      const savedTeacher = await newTeacher.save();

      console.log("New teacher created:", savedTeacher);
      return res.status(201).json({ message: "Teacher created successfully" });
    }
  } catch (error) {
    console.error("Error saving teacher:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash("sha256");
  const hash = sha256.update(password).digest("base64");
  return hash;
};

router.patch("/changePassword", async (req, res) => {
  try {
    const email = req.body.email;
    const hashedPassword = getHashedPassword(req.body.password);

    // Update the password for the user
    const result = await teacherModel.findOneAndUpdate(
      { email: email },
      { password: hashedPassword }
    );

    if (!result) throw new Error("User doesn't exist!");
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(400).json({ message: "Something went wrong" });
  }
});
const courseModel = require("../model/course.model");
router.get("/allocatedCourses", async (req, res) => {
  try {
    const { email } = req.query;

    // Check if the provided email exists
    const existingTeacher = await teacherModel.findOne({ email });
    if (!existingTeacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Retrieve assigned courses for the teacher
    const allocatedCourses = existingTeacher.assignedCourses;
    const batch = existingTeacher.batch;

    // If no allocated courses, return empty array
    if (!allocatedCourses || allocatedCourses.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch course details for each allocated course ID
    const allocatedCoursesDetails = [];
    for (let i = 0; i < allocatedCourses.length; i++) {
      const course = await courseModel.findOne({
        courseid: allocatedCourses[i],
      });
      if (course) {
        allocatedCoursesDetails.push({
          courseName: course.courseName,
          courseCode: allocatedCourses[i],
          batch: batch[i],
        });
      } else {
        allocatedCoursesDetails.push({
          courseName: null,
          courseCode: allocatedCourses[i],
          batch: batch[i],
        });
      }
    }

    // Return allocated courses with their names
    return res.status(200).json(allocatedCoursesDetails);
  } catch (error) {
    console.error("Error retrieving allocated courses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Route to upload file and send notifications to all students
const materialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/material"); // Save uploaded files to the 'uploads/material' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const uploadMaterial = multer({ storage: materialStorage });

router.post(
  "/uploadmaterial",
  uploadMaterial.single("file"),
  async (req, res) => {
    try {
      // Extract notification message, sender, and batch from request body
      const { message, sender, batch } = req.body;

      // Save the uploaded file path in the database
      const newMaterial = new materialModel({
        sender: sender, // Assuming admin is sending the notification
        message: message,
        batch: batch,
        file: req.file.path, // File path returned by Multer
      });
      await newMaterial.save();

      // Fetch students belonging to the specified batch from the database
      const students = await studentModel.find({ batch: batch });

      // Iterate over each student and send notification
      students.forEach(async (student) => {
        // Update student's notifications array with the new message
        student.notifications.push({
          message: message,
          sender: sender,
          file: req.file.path,
        });
        await student.save();
      });

      // Return success response
      res.status(200).json({
        message:
          "File uploaded and notifications sent to students in the specified batch.",
      });
    } catch (error) {
      console.error("Error uploading file and sending notifications:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);
router.post("/uploadattendance", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileName = req.file.originalname;
    const fileNameParts = fileName.split("-");
    if (fileNameParts.length < 3) {
      return res.status(400).json({ error: "Invalid filename format." });
    }

    const instructorName = fileNameParts[0]?.trim();
    const courseCode = fileNameParts[1]?.trim();
    const batch = fileNameParts[2]?.trim()?.split(".")[0];

    // Check if any part of the filename is undefined or empty
    if (!instructorName || !courseCode || !batch) {
      return res.status(400).json({ error: "Invalid filename format." });
    }

    // Load the attendance Excel file
    const workbook = xlsx.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const attendanceData = xlsx.utils.sheet_to_json(worksheet);

    // Iterate over each attendance record and update attendance in the grade model
    for (const record of attendanceData) {
      const { "Student ID": studentID, Attendance } = record;

      // Find the student's grade using ID, instructor, and batch
      let existingGrade = await gradeModel.findOneAndUpdate(
        { id: studentID, instructor: instructorName, batch: batch },
        { $set: { attendance: [{ date: new Date(), status: Attendance }] } },
        { upsert: true, new: true }
      );
    }

    // Delete the uploaded file after processing
    fs.unlinkSync(req.file.path);

    return res
      .status(200)
      .json({ message: "Attendance updated successfully." });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/approveGradeChangeRequest", async (req, res) => {
  try {
    const { requestId, teacherId, course } = req.body;

    // Find the teacher by ID
    const teacher = await teacherModel.findOne({ id: req.body.teacherId });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Find the change request in the teacher's changeRequests array
    const changeRequest = teacher.changeRequests.find(
      (req) => req.requestId === requestId
    );
    if (!changeRequest) {
      return res.status(404).json({ error: "Grade change request not found" });
    }
    console.log("Sender:", changeRequest);
    console.log("Course:", course);

    // Fetch the existing grade from the grade model
    const existingGrade = await gradeModel.findOne({
      id: changeRequest.sender, // Use sender as the id
      course: changeRequest.course,
    });
    if (!existingGrade) {
      return res.status(404).json({ error: "Existing grade not found" });
    }

    // Capture the previous grades
    const previousGrades = {
      mid: existingGrade.mid,
      final: existingGrade.final,
      assessment: existingGrade.assessment,
      grade: existingGrade.grade,
    };

    // Update the grade model based on the change request values
    const updateFields = {};
    if (changeRequest.mid !== null && changeRequest.mid !== existingGrade.mid)
      updateFields.mid = changeRequest.mid;
    if (
      changeRequest.final !== null &&
      changeRequest.final !== existingGrade.final
    )
      updateFields.final = changeRequest.final;
    if (
      changeRequest.assessment !== null &&
      changeRequest.assessment !== existingGrade.assessment
    )
      updateFields.assessment = changeRequest.assessment;
    if (
      changeRequest.grade !== null &&
      changeRequest.grade !== existingGrade.grade
    )
      updateFields.grade = changeRequest.grade;

    await gradeModel.findOneAndUpdate(
      {
        id: changeRequest.sender, // Use sender as the id
        course: changeRequest.course,
      },
      { $set: updateFields }
    );

    // Update the grade change request's approval status
    changeRequest.approved = true;

    // Remove the approved request from the changeRequests array
    teacher.changeRequests = teacher.changeRequests.filter(
      (req) => req.requestId !== requestId
    );

    // Save the updated teacher document
    await teacher.save();

    // Capture the changed grades
    const changedGrades = {
      mid:
        updateFields.mid !== undefined ? updateFields.mid : previousGrades.mid,
      final:
        updateFields.final !== undefined
          ? updateFields.final
          : previousGrades.final,
      assessment:
        updateFields.assessment !== undefined
          ? updateFields.assessment
          : previousGrades.assessment,
      grade:
        updateFields.grade !== undefined
          ? updateFields.grade
          : previousGrades.grade,
    };

    return res.status(200).json({
      message: "Grade change request approved and removed successfully",
      changedGrades: {
        previous: previousGrades,
        current: changedGrades,
      },
    });
  } catch (error) {
    console.error("Error approving grade change request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gradechangeRequests", async (req, res) => {
  try {
    const { id } = req.query;

    // Find the teacher by ID
    const teacher = await teacherModel.findOne({ id: id });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Check if there are any change requests for the teacher
    if (!teacher.changeRequests || teacher.changeRequests.length === 0) {
      return res
        .status(404)
        .json({ message: "No change requests found for this teacher" });
    }

    // Retrieve the change requests for the teacher
    const changeRequests = teacher.changeRequests;

    res.status(200).json(changeRequests);
  } catch (error) {
    console.error("Error retrieving change requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
  // res.json({
  //   requestQuery: req.query
  // })
});

module.exports = router;
