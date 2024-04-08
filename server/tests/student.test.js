const request = require('supertest');
const express = require('express');
const studentRouter = require('../router/student.router');

const app = express();
app.use(express.json());
app.use('/student', studentRouter);

describe('Student Router Endpoints', () => {
  it('POST /register - responds with 201 if registration is successful', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        id: 'ZR9900',
        name: 'John Doe',
        gender: 'Male',
        email: 'john.doe@example.com',
        phone: '1234567890',
        guardianName: 'Jane Doe',
        guardianPhone: '9876543210',
        department: 'Computer Science',
        aboutYou: 'I am a student.'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('John Doe');
    // Add more expectations as needed
  });

  it('POST /student/signup - responds with 404 if user does not exist', async () => {
    const res = await request(app)
      .post('/student/signup')
      .send({ id: 'XA5305', password: 'password123', restriction: false });

    expect(res.status).toBe(404);
  });

  it('POST /student/signin - responds with 404 if user does not exist', async () => {
    const res = await request(app)
      .post('/student/signin')
      .send({ id: 'XA5305', password: 'password123' });

    expect(res.status).toBe(404);
  });

  // Add more test cases for other endpoints
});
