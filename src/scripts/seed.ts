import { connectDatabase, disconnectDatabase } from "../config/db";
import { env } from "../config/env";
import { Admin } from "../models/Admin";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { syncContactRegistry } from "../utils/contactUniqueness";

const DEMO_DOCTORS = [
  {
    name: "Dr. Mahmudul Hasan",
    specialization: "Cardiology",
    hospital: "National Heart Foundation Hospital, Dhaka",
    phone: "8801711234501",
    email: "mahmudul.hasan@nhf.org.bd",
  },
  {
    name: "Dr. Farhana Rahman",
    specialization: "Neurology",
    hospital: "Dhaka Medical College Hospital",
    phone: "8801711234502",
    email: "farhana.rahman@dmch.gov.bd",
  },
  {
    name: "Dr. Tasnim Akter",
    specialization: "Pediatrics",
    hospital: "Bangladesh Shishu Hospital & Institute",
    phone: "8801819345603",
    email: "tasnim.akter@shishu.org.bd",
  },
  {
    name: "Dr. Rafiqul Islam",
    specialization: "Orthopedics",
    hospital: "NITOR (Pangu Hospital), Dhaka",
    phone: "8801911456704",
    email: "rafiqul.islam@nitor.gov.bd",
  },
  {
    name: "Dr. Nusrat Jahan",
    specialization: "Dermatology",
    hospital: "Square Hospital, Dhaka",
    phone: "8801713567805",
    email: "nusrat.jahan@squarehospital.com",
  },
];

async function seed() {
  const withDemo = process.argv.includes("--demo");

  await connectDatabase();

  let admin = await Admin.findOne({ email: env.ADMIN_EMAIL });
  if (!admin) {
    admin = await Admin.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(`Created initial admin: ${admin.email}`);
  } else {
    console.log(`Admin already exists: ${admin.email}`);
  }

  if (withDemo) {
    const existingDoctors = await Doctor.countDocuments();
    if (existingDoctors === 0) {
      const now = new Date();
      const createdDoctors = await Doctor.insertMany(
        DEMO_DOCTORS.map((doc, idx) => ({
          ...doc,
          createdAt: new Date(now.getTime() - (idx * 25 + 10) * 24 * 60 * 60 * 1000),
          updatedAt: now,
        }))
      );

      const conditions = [
        "Hypertension",
        "Migraine Disorder",
        "Type 2 Diabetes",
        "Seasonal Asthma",
        "Lumbar Strain",
        "Arrhythmia",
        "Eczema",
        "Osteoarthritis",
      ];

      const samplePatients = [
        { name: "Tariqul Islam", age: 48, gender: "Male", phone: "8801712100201", email: "tariqul.islam@example.com", condition: conditions[0], doctorIdx: 0, daysAgo: 2 },
        { name: "Sadia Afrin", age: 34, gender: "Female", phone: "8801812100202", email: "sadia.afrin@example.com", condition: conditions[1], doctorIdx: 1, daysAgo: 3 },
        { name: "Arifur Rahman", age: 9, gender: "Male", phone: "8801912100203", email: "arifur.rahman@example.com", condition: conditions[3], doctorIdx: 2, daysAgo: 5 },
        { name: "Meherunnisa Begum", age: 61, gender: "Female", phone: "8801715100204", email: "meherunnisa.b@example.com", condition: conditions[5], doctorIdx: 0, daysAgo: 6 },
        { name: "Tanvir Ahmed", age: 29, gender: "Male", phone: "8801612100205", email: "tanvir.ahmed@example.com", condition: conditions[4], doctorIdx: 3, daysAgo: 8 },
        { name: "Nabila Chowdhury", age: 42, gender: "Female", phone: "8801716100206", email: "nabila.c@example.com", condition: conditions[6], doctorIdx: 4, daysAgo: 10 },
        { name: "Kamrul Hasan", age: 55, gender: "Male", phone: "8801815100207", email: "kamrul.hasan@example.com", condition: conditions[0], doctorIdx: 0, daysAgo: 12 },
        { name: "Sharmin Sultana", age: 67, gender: "Female", phone: "8801718100208", email: "sharmin.sultana@example.com", condition: conditions[7], doctorIdx: 3, daysAgo: 22 },
        { name: "Mehedi Hasan", age: 24, gender: "Male", phone: "8801915100209", email: "mehedi.hasan@example.com", condition: conditions[1], doctorIdx: 1, daysAgo: 35 },
        { name: "Zarin Tasnim", age: 12, gender: "Female", phone: "8801719100210", email: "zarin.tasnim@example.com", condition: conditions[3], doctorIdx: 2, daysAgo: 48 },
        { name: "Anisur Rahman", age: 51, gender: "Male", phone: "8801818100211", email: "anisur.rahman@example.com", condition: conditions[2], doctorIdx: 0, daysAgo: 68 },
        { name: "Fariha Tabassum", age: 39, gender: "Female", phone: "8801720100212", email: "fariha.t@example.com", condition: conditions[4], doctorIdx: 3, daysAgo: 95 },
      ];

      await Patient.insertMany(
        samplePatients.map((p) => {
          const date = new Date(now.getTime() - p.daysAgo * 24 * 60 * 60 * 1000);
          return {
            name: p.name,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            email: p.email,
            condition: p.condition,
            doctorId: createdDoctors[p.doctorIdx]._id,
            createdAt: date,
            updatedAt: date,
          };
        })
      );

      await syncContactRegistry();

      console.log(`Seeded ${createdDoctors.length} demo doctors and ${samplePatients.length} demo patients.`);
    } else {
      await syncContactRegistry();
      console.log("Demo data skipped: doctors collection is not empty.");
    }
  }

  await disconnectDatabase();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await disconnectDatabase();
  process.exit(1);
});

