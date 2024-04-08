const express = require("express");
const studentModel = require("../model/student.model");
const payment = require("../model/payment.model");
const courseModel = require("../model/course.model");
const PDFDocument = require("pdfkit");
const router = express.Router();
const multer = require("multer");
const crypto = require("crypto");
const gradeModel = require("../model/grade.model");
const teacherModel = require("../model/teacher.model");
const materialModel = require("../model/material.model");
const studentcourseModel = require("../model/studentcourse.mode");

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash("sha256");
  const hash = sha256.update(password).digest("base64");
  return hash;
};

function generateID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";

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

function generatePaymentID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";

  // Generate two random letters
  for (let i = 0; i < 2; i++) {
    id += "PR" + letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate four random numbers
  for (let i = 0; i < 4; i++) {
    id += Math.floor(Math.random() * 10);
  }

  return id;
}
function changeRequestID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";

  // Generate two random letters
  for (let i = 0; i < 2; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate four random numbers
  for (let i = 0; i < 4; i++) {
    id += Math.floor(Math.random() * 10);
  }

  return "CR" + id;
}
function generateBatch() {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().substr(2, 2); // Get the last two digits of the year
  const month = currentDate.getMonth() + 1; // Months are zero-indexed, so add 1

  // Check if it's before or after half the year
  const batchSuffix = month <= 6 ? "01" : "02";

  const batch = `DRB${year}${batchSuffix}`;
  return batch;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/files"); // Define the destination directory for file uploads
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); // Define the filename for the uploaded file
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});
const uploadpayment = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/payments"); // Define the destination directory for file uploads
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); // Define the filename for the uploaded file
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Handle POST request to register a new student with file upload for academic record
router.post("/register", upload.single("academicRecord"), (req, res) => {
  // Check if the provided email already exists
  studentModel
    .findOne({ email: req.body.email })
    .then((existingEmail) => {
      if (existingEmail) {
        // Email already exists
        return res.status(409).json({ error: "Email already exists" });
      } else {
        // Check if the provided ID already exists
        studentModel
          .findOne({ id: generateID() })
          .then((existingID) => {
            if (existingID) {
              // ID already exists
              return res.status(409).json({ error: "ID already exists" });
            } else {
              // Both email and ID are unique, perform file upload
              // upload.single("academicRecord")(req, res, (err) => {
              //   if (err) {
              //     // Error during file upload
              //     console.error(err);
              //     return res.status(500).json({ error: "File upload error" });
              //   }

              // File uploaded successfully, create and save the new student
              const newStudent = new studentModel({
                id: generateID(), // Use provided ID
                batch: generateBatch(),
                role: "Student",
                name: req.body.name,
                gender: req.body.gender,
                email: req.body.email,
                phone: req.body.phone,
                guardianName: req.body.guardianName,
                guardianPhone: req.body.guardianPhone,
                department: req.body.department,
                aboutYou: req.body.aboutYou,
                academicRecord: req.file ? req.file.filename : null, // Save filename if file is uploaded
              });

              newStudent
                .save()
                .then((savedStudent) => {
                  res.status(201).json(savedStudent);
                })
                .catch((err) => {
                  console.error(err);
                  res.status(500).json({ error: "Internal server error" });
                });
              // });
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
});

router.patch("/changePassword", async (req, res) => {
  try {
    const id = req.body.id;
    const hashedPassword = getHashedPassword(req.body.password);

    // Update the password for the user
    const result = await studentModel.findOneAndUpdate(
      { id: id },
      { password: hashedPassword }
    );

    if (!result) throw new Error("User doesn't exist!");
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(400).json({ message: "Something went wrong" });
  }
});

//TODO: Make sure to add frontend comparison of password and confirmation
router.post("/signup", async (req, res) => {
  try {
    const id = req.body.id;
    const restriction = req.body.restriction;
    const hashedPassword = getHashedPassword(req.body.password);

    // Check if password is already set for the user
    const existingUser = await studentModel.findOne({ id: id });

    if (existingUser && existingUser.password) {
      // Password is already set for this user
      return res.status(400).json({ error: "User already exists" });
    }

    // Update the password for the user
    const result = await studentModel.findOneAndUpdate(
      { id: id },
      { password: hashedPassword }
    );

    if (!result) {
      return res.status(404).json({ error: "User doesn't exist!" });
    }
    //FIXME: check whether student is restricted or not

    return res.status(201).json({ message: "User Signup completed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/signin", (req, res) => {
  studentModel
    .findOne({
      id: req.body.id,
    })
    .then((data) => {
      if (data) {
        // Check if account is restricted
        if (data.restricted === true) {
          // Account is restricted, prompt user to contact admin
          return res.status(403).json({
            error:
              "Your account is restricted. Please contact the system administrator.",
          });
        } else {
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

router.post(
  "/uploadpayment",
  uploadpayment.single("paymentReceipt"),
  async (req, res) => {
    try {
      const studentId = req.body.id;

      // Check if the provided ID already exists in the studentModel
      const existingStudent = await studentModel.findOne({ id: studentId });

      if (!existingStudent) {
        // ID does not exist, return an error
        return res.status(404).json({ error: "ID does not exist" });
      }

      // Create and save the new payment with the student's name
      const newPayment = new payment({
        id: studentId,
        paymentId: generatePaymentID(),
        studentName: existingStudent.name,
        paymentReceipt: req.file ? req.file.filename : null,
        // Add any other fields related to payment schema here
      });

      const savedPayment = await newPayment.save();
      return res.status(201).json(savedPayment);
    } catch (error) {
      console.error("Error uploading payment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/payment", (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res
      .status(400)
      .json({ error: "ID is required in the request body" });
  }

  // Search the payment model by ID
  payment
    .find({ id: id })
    .then((payment) => {
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.status(200).json(payment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});
router.get("/grades", (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res
      .status(400)
      .json({ error: "ID is required in the request body" });
  }

  // Search the grade model by ID
  gradeModel
    .find({ id: id }) // Use find instead of findOne
    .then((grades) => {
      if (grades.length === 0) {
        return res.status(404).json({ error: "Grades not found" });
      }
      res.status(200).json(grades);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});
router.get("/gradesoptional", (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res
      .status(400)
      .json({ error: "ID is required in the query parameters" });
  }

  // Search the grade model by ID
  gradeModel
    .find({ id: id })
    .then((grades) => {
      if (grades.length === 0) {
        return res.status(404).json({ error: "Grades not found" });
      }
      res.status(200).json(grades);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});
// router.get("/courses", async (req, res) => {
//   try {
//     // Query the database to find all courses
//     const courses = await studentcourseModel.find({}, {});

//     // Get the student ID from the request query
//     const { studentId } = req.query;

//     // If studentId is not provided, return all courses without modification
//     if (!studentId) {
//       return res.status(200).json(courses);
//     }

//     // Find the student's grades
//     const studentGrades = await gradeModel.find({ id: studentId });

//     // Iterate over courses and update the status based on whether the student has taken the course
//     const updatedCourses = courses.map((course) => {
//       // Check if the student has grades for this course
//       const hasTakenCourse = studentGrades.some(
//         (grade) => grade.course === course.courseCode
//       );

//       // If the student has taken the course, update the status
//       if (hasTakenCourse) {
//         // Update the status to true in the studentcourseModel
//         studentcourseModel.updateOne(
//           { courseCode: course.courseCode, studentId: studentId },
//           { status: true },
//           (err, result) => {
//             if (err) {
//               console.error("Error updating course status:", err);
//             }
//           }
//         );
//       }

//       // Return the course with updated status
//       return { ...course.toJSON(), status: hasTakenCourse };
//     });

//     // Return the retrieved courses with updated status as the response
//     res.status(200).json(updatedCourses);
//   } catch (error) {
//     // If an error occurs, return an error response
//     console.error("Error retrieving courses:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
router.get("/courses", async (req, res) => {
  try {
    const studentId = req.query.id;

    // Find all grades associated with the provided student ID
    const studentGrades = await gradeModel.find({ id: studentId });

    // Extract unique course names from the grades
    const uniqueCourses = [
      ...new Set(studentGrades.map((grade) => grade.course)),
    ];

    // Find all courses
    const allCourses = await courseModel.find();

    // Update status to true for courses found in the course model
    const updatedCourses = allCourses.map((course) => {
      if (uniqueCourses.includes(course.courseid)) {
        course.status = true;
      } else {
        course.status = false;
      }
      return course;
    });

    // Save the updated courses
    const savedCourses = await Promise.all(
      updatedCourses.map((course) => course.save())
    );

    // Return updated courses
    res.status(200).json(savedCourses);
  } catch (error) {
    console.error("Error updating courses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gradeChangeRequest", async (req, res) => {
  try {
    const {
      studentId,
      teacherId,
      message,
      course,
      mid,
      final,
      assessment,
      grade,
    } = req.body;

    // Find the student by ID
    const student = await studentModel.findOne({ id: studentId });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find the teacher by ID
    const teacher = await teacherModel.findOne({ id: teacherId });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Create the grade change request object
    const changeRequest = {
      course: course,
      requestId: "RQ" + generateID(),
      teacherId: req.body.teacherId,
      sender: studentId,
      message: message,
      approved: false,
      time: Date.now(),
      mid: mid,
      final: final,
      assessment: assessment,
      grade: grade,
    };

    // Add the grade change request to the teacher's changeRequests array
    teacher.changeRequests.push(changeRequest);

    // Save the updated teacher document
    await teacher.save();

    return res.status(200).json(changeRequest);
  } catch (error) {
    console.error("Error submitting grade change request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/material", async (req, res) => {
  const { batch } = req.query;
  try {
    // Find the material by ID
    const material = await materialModel.find({ batch });
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    // Return the material data
    return res.status(200).json(material);
  } catch (error) {
    console.error("Error retrieving material:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/getnotification", (req, res) => {
  const { id } = req.query;

  // Find the student by ID
  studentModel
    .findOne({ id: id })
    .then((student) => {
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get the notifications array from the student object
      const notifications = student.notifications;

      // Return the notifications array as the response
      res.status(200).json({ notifications });
    })
    .catch((error) => {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

const fs = require("fs");
const path = require("path");

// router.get("/generatetranscript", async (req, res) => {
//   try {
//     const { id } = req.query;

//     // Find the student by ID
//     const student = await studentModel.findOne({ id });

//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     // Find grades for the student
//     const studentGrades = await gradeModel.find({ id });

//     if (studentGrades.length === 0) {
//       return res.status(404).json({ error: "No grades found for the student" });
//     }

//     // Fetch course details for each grade
//     for (const grade of studentGrades) {
//       const course = await courseModel.findOne({ courseid: grade.course });
//       if (course) {
//         grade.courseName = course.courseName;
//         grade.creditHour = course.credithour;
//       }
//     }

//     // Create a new PDF document
//     const doc = new PDFDocument();

//     // Set response headers for PDF
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${id}_transcript.pdf"`
//     );

//     // Pipe PDF document to response
//     doc.pipe(res);

//     // Add fancy header
//     doc.fontSize(24).text("HiLCoE School of Computer Science and Technology", {
//       align: "center",
//     });
//     doc.moveDown(0.5);
//     doc
//       .fontSize(14)
//       .text("Location: 4 Kilo Addis Ababa, Ethiopia", { align: "center" });
//     doc.text("Phone: +251-115-51265", { align: "center" });
//     doc.text("Student Transcript", { align: "center" });
//     doc.moveDown(0.5);

//     // Add student information
//     doc.text(`Student ID: ${student.id}`, { align: "left" });
//     doc.text(`Student Name: ${student.name}`, { align: "left" });
//     doc.text(`Student Email: ${student.email}`, { align: "left" });
//     // Add any additional student information as needed

//     // Add transcript table to PDF
//     const tableWidth = 500;
//     const startX = (doc.page.width - tableWidth) / 2;
//     const startY = doc.y;
//     const cellWidth = tableWidth / 4;
//     const cellHeight = 30;

//     // Header row
//     doc
//       .rect(startX, startY, tableWidth, cellHeight)
//       .fillAndStroke("#666666", "#000000");
//     doc.fillColor("#FFFFFF").text("Course Code", startX, startY + 15, {
//       width: cellWidth,
//       align: "center",
//       lineBreak: false,
//     });
//     doc.text("Course Name", startX + cellWidth, startY + 15, {
//       width: cellWidth,
//       align: "center",
//       lineBreak: false,
//     });
//     doc.text("Credit Hour", startX + cellWidth * 2, startY + 15, {
//       width: cellWidth,
//       align: "center",
//       lineBreak: false,
//     });
//     doc.text("Grade", startX + cellWidth * 3, startY + 15, {
//       width: cellWidth,
//       align: "center",
//       lineBreak: false,
//     });

//     // Middle lines and data rows
//     for (let i = 0; i <= studentGrades.length; i++) {
//       const yPos = startY + (i + 1) * cellHeight;
//       doc
//         .moveTo(startX, yPos)
//         .lineTo(startX + tableWidth, yPos)
//         .stroke();

//       if (i < studentGrades.length) {
//         const grade = studentGrades[i];
//         doc.fillColor("#000000").text(grade.course, startX, yPos + 15, {
//           width: cellWidth,
//           align: "center",
//           lineBreak: false,
//         });
//         doc.text(grade.courseName || "", startX + cellWidth, yPos + 15, {
//           width: cellWidth,
//           align: "center",
//           lineBreak: false,
//         });
//         doc.text(grade.creditHour || "", startX + cellWidth * 2, yPos + 15, {
//           width: cellWidth,
//           align: "center",
//           lineBreak: false,
//         });
//         doc.text(grade.grade || "", startX + cellWidth * 3, yPos + 15, {
//           width: cellWidth,
//           align: "center",
//           lineBreak: false,
//         });
//       }
//     }

//     // Add signature section
//     doc.moveDown(2);
//     doc.text("Verified by:", { align: "center" });

//     // Finalize PDF
//     doc.end();
//   } catch (error) {
//     console.error("Error generating transcript:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

router.get("/generatetranscript", async (req, res) => {
  try {
    const { id } = req.query;

    // Find the student by ID
    const student = await studentModel.findOne({ id });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find grades for the student
    const studentGrades = await gradeModel.find({ id });

    if (studentGrades.length === 0) {
      return res.status(404).json({ error: "No grades found for the student" });
    }

    // Fetch course details for each grade
    for (const grade of studentGrades) {
      const course = await courseModel.findOne({ courseid: grade.course });
      if (course) {
        grade.courseName = course.courseName;
        grade.creditHour = course.credithour;
      }
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Generate file name
    const fileName = `${id}_transcript.pdf`;
    const filePath = path.join(__dirname, "../uploads/transcript", fileName);

    // Pipe PDF document to file stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add content to the PDF document
    doc.fontSize(24).text("HiLCoE School of Computer Science and Technology", {
      align: "center",
    });
    // Add more content here as needed...
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .text("Location: 4 Kilo Addis Ababa, Ethiopia", { align: "center" });
    doc.text("Phone: +251-115-51265", { align: "center" });
    doc.text("Student Transcript", { align: "center" });
    doc.moveDown(0.5);

    // Add student information
    doc.text(`Student ID: ${student.id}`, { align: "left" });
    doc.text(`Student Name: ${student.name}`, { align: "left" });
    doc.text(`Student Email: ${student.email}`, { align: "left" });
    // Add any additional student information as needed

    // Add transcript table to PDF
    const tableWidth = 500;
    const startX = (doc.page.width - tableWidth) / 2;
    const startY = doc.y;
    const cellWidth = tableWidth / 4;
    const cellHeight = 30;

    // Header row
    doc
      .rect(startX, startY, tableWidth, cellHeight)
      .fillAndStroke("#666666", "#000000");
    doc.fillColor("#FFFFFF").text("Course Code", startX, startY + 15, {
      width: cellWidth,
      align: "center",
      lineBreak: false,
    });
    doc.text("Course Name", startX + cellWidth, startY + 15, {
      width: cellWidth,
      align: "center",
      lineBreak: false,
    });
    doc.text("Credit Hour", startX + cellWidth * 2, startY + 15, {
      width: cellWidth,
      align: "center",
      lineBreak: false,
    });
    doc.text("Grade", startX + cellWidth * 3, startY + 15, {
      width: cellWidth,
      align: "center",
      lineBreak: false,
    });

    // Middle lines and data rows
    for (let i = 0; i <= studentGrades.length; i++) {
      const yPos = startY + (i + 1) * cellHeight;
      doc
        .moveTo(startX, yPos)
        .lineTo(startX + tableWidth, yPos)
        .stroke();

      if (i < studentGrades.length) {
        const grade = studentGrades[i];
        doc.fillColor("#000000").text(grade.course, startX, yPos + 15, {
          width: cellWidth,
          align: "center",
          lineBreak: false,
        });
        doc.text(grade.courseName || "", startX + cellWidth, yPos + 15, {
          width: cellWidth,
          align: "center",
          lineBreak: false,
        });
        const { year } = await courseModel
          .findOne({ courseid: grade.course })
          .select("year");

        doc.text(year || "", startX + cellWidth * 2, yPos + 15, {
          width: cellWidth,
          align: "center",
          lineBreak: false,
        });
        doc.text(grade.grade || "", startX + cellWidth * 3, yPos + 15, {
          width: cellWidth,
          align: "center",
          lineBreak: false,
        });
      }
    }

    // Add signature section
    doc.moveDown(2);
    doc.text("Verified by:", { align: "center" });

    doc.end();

    stream.on("finish", () => {
      res.status(200).json({ url: `/uploads/transcript/${fileName}` });
    });
  } catch (error) {
    console.error("Error generating transcript:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
