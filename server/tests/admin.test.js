const axios = require('axios');
const app = require('../router/admin.router');

const port = 8000;

describe('Admin Router Endpoints', () => {
  // beforeAll((done) => {
  //   app.listen(port, () => {
  //     console.log(`Server is running on port ${port}`);
  //     done();
  //   });
  // });

  it('POST /verifypayment - responds with 200 if payment is verified successfully', async () => {
    try {
      const res = await axios.post(`http://localhost:${port}/admin/verifypayment`, { id: 'XA5305' });
      expect(res.status).toEqual(200);
    } catch (error) {
      throw new Error(error);
    }
  });

  it('POST /admin/verifystudent - responds with 200 if student sign-up is verified successfully', async () => {
    try {
      const res = await axios.post(`http://localhost:${port}/admin/verifystudent`, { id: 'XA5305' });
      expect(res.status).toEqual(200);
    } catch (error) {
      throw new Error(error);
    }
  });

  it('GET /admin/restricted - responds with 200 and an array of restricted students', async () => {
    try {
      const res = await axios.get(`http://localhost:${port}/admin/restricted`);
      expect(res.status).toEqual(200);
      expect(Array.isArray(res.data)).toBe(true);
    } catch (error) {
      throw new Error(error);
    }
  });

  it('POST /admin/courses - responds with 201 and the created course if successful', async () => {
    try {
      const course = {
        name: 'Computer Programming 2',
        courseId: 'CS123'
      };
      const res = await axios.post(`http://localhost:${port}/admin/courses`, course);
      expect(res.status).toEqual(201);
      expect(res.data).toHaveProperty('_id');
      expect(res.data.courseName).toEqual(course.name);
      expect(res.data.courseid).toEqual(course.courseId);
    } catch (error) {
      throw new Error(error);
    }
  });

  it('POST /admin/banstudent - responds with 200 if student is banned successfully', async () => {
    try {
      const res = await axios.post(`http://localhost:${port}/admin/banstudent`, { id: 'XA5305' });
      expect(res.status).toEqual(200);
    } catch (error) {
      throw new Error(error);
    }
  });

  // afterAll((done) => {
  //   server.close(() => {
  //     console.log('Server closed');
  //     done();
  //   });
  // });
});