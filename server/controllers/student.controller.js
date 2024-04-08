const student = require("../model/student.model");

//   // Example usage
//   const id = generateID();
//   console.log(id);
const register = async (req, res) => {
  try {
    if (!req.body.name) {
      res.status(400).json({ error: "Mission Value" });
    } else {
      await student.create(newStudent);
      res.status(200).json({ message: "Student Registered" }).end();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = register;
