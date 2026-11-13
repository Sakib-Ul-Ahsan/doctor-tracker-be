import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app";
import { Admin } from "../src/models/Admin";

let mongod: MongoMemoryServer;
const app = createApp();

describe("Doctor Tracker Backend API", () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Admin.create({
      name: "Test Admin",
      email: "admin@test.local",
      password: "Password123!",
      role: "admin",
    });
    agent = request.agent(app);
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  it("blocks protected routes when unauthenticated", async () => {
    const res = await request(app).get("/api/doctors");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("authenticates admin via HTTP-only cookie and returns /api/auth/me", async () => {
    const badLogin = await agent
      .post("/api/auth/login")
      .send({ email: "admin@test.local", password: "wrong" });
    expect(badLogin.status).toBe(401);

    const loginRes = await agent
      .post("/api/auth/login")
      .send({ email: "admin@test.local", password: "Password123!" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.admin.email).toBe("admin@test.local");

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.admin.email).toBe("admin@test.local");
  });

  it("manages doctors, patients, safe deletion policy, and dashboard aggregations", async () => {
    // Create two doctors
    const doc1Res = await agent.post("/api/doctors").send({
      name: "Dr. Ashraful Alam",
      specialization: "Cardiology",
      hospital: "Dhaka Medical College Hospital",
      phone: "+880-1711-001001",
      email: "ashraful@dmch.gov.bd",
    });
    expect(doc1Res.status).toBe(201);
    const doc1Id = doc1Res.body.data.doctor._id;

    const doc2Res = await agent.post("/api/doctors").send({
      name: "Dr. Samira Chowdhury",
      specialization: "Neurology",
      hospital: "Square Hospital, Dhaka",
      phone: "+880-1711-001002",
      email: "samira@square.org.bd",
    });
    expect(doc2Res.status).toBe(201);
    const doc2Id = doc2Res.body.data.doctor._id;

    // Create patient under doctor 1
    const patientRes = await agent.post("/api/patients").send({
      name: "Kamal Uddin",
      age: 45,
      gender: "Male",
      phone: "+880-1812-002001",
      email: "kamal.uddin@example.com",
      condition: "Hypertension",
      doctorId: doc1Id,
    });
    expect(patientRes.status).toBe(201);
    const patientId = patientRes.body.data.patient._id;

    // Doctor 1 patients endpoint
    const docPatientsRes = await agent.get(`/api/doctors/${doc1Id}/patients`);
    expect(docPatientsRes.status).toBe(200);
    expect(docPatientsRes.body.data.patients).toHaveLength(1);

    // Prevent deleting doctor with assigned patients
    const blockedDeleteRes = await agent.delete(`/api/doctors/${doc1Id}`);
    expect(blockedDeleteRes.status).toBe(409);
    expect(blockedDeleteRes.body.code).toBe("DOCTOR_HAS_PATIENTS");

    // Reassign and delete safely
    const safeDeleteRes = await agent.delete(`/api/doctors/${doc1Id}?reassignTo=${doc2Id}`);
    expect(safeDeleteRes.status).toBe(200);
    expect(safeDeleteRes.body.data.reassignedPatientsCount).toBe(1);

    // Patient should now belong to doctor 2
    const patientDetailRes = await agent.get(`/api/patients/${patientId}`);
    expect(patientDetailRes.status).toBe(200);
    expect(patientDetailRes.body.data.patient.doctorId._id).toBe(doc2Id);

    // Search and filter doctors
    const searchDocRes = await agent.get("/api/doctors?search=Samira&specialization=Neurology");
    expect(searchDocRes.status).toBe(200);
    expect(searchDocRes.body.data.doctors).toHaveLength(1);
    expect(searchDocRes.body.data.doctors[0].patientCount).toBe(1);

    // Update doctor
    const updateDocRes = await agent
      .patch(`/api/doctors/${doc2Id}`)
      .send({ hospital: "Evercare Hospital, Dhaka" });
    expect(updateDocRes.status).toBe(200);
    expect(updateDocRes.body.data.doctor.hospital).toBe("Evercare Hospital, Dhaka");

    // Search, filter and update patient
    const searchPatRes = await agent.get("/api/patients?search=Kamal&condition=Hypertension");
    expect(searchPatRes.status).toBe(200);
    expect(searchPatRes.body.data.patients).toHaveLength(1);

    const updatePatRes = await agent
      .patch(`/api/patients/${patientId}`)
      .send({ age: 46, condition: "Stage 1 Hypertension" });
    expect(updatePatRes.status).toBe(200);
    expect(updatePatRes.body.data.patient.age).toBe(46);

    // Dashboard stats aggregation
    const statsRes = await agent.get("/api/dashboard/stats");
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.summary.totalDoctors).toBe(1);
    expect(statsRes.body.data.summary.totalPatients).toBe(1);
    expect(statsRes.body.data.summary.avgPatientsPerDoctor).toBe(1);
    expect(statsRes.body.data.registrationTrends).toHaveLength(14);
    expect(statsRes.body.data.monthlyStats).toHaveLength(6);

    // Delete patient
    const delPatRes = await agent.delete(`/api/patients/${patientId}`);
    expect(delPatRes.status).toBe(200);

    // Logout clears session
    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const afterLogoutMe = await agent.get("/api/auth/me");
    expect(afterLogoutMe.status).toBe(401);
  });
});
