import { Request, Response } from "express";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

  const [
    totalDoctors,
    totalPatients,
    recentDoctors,
    recentPatients,
    doctorDistribution,
    dailyTrendAgg,
    monthlyPatientsAgg,
    monthlyDoctorsAgg,
    specializationsCountAgg,
  ] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "doctorId",
          as: "patients",
        },
      },
      {
        $project: {
          name: 1,
          specialization: 1,
          hospital: 1,
          email: 1,
          phone: 1,
          createdAt: 1,
          patientCount: { $size: "$patients" },
        },
      },
    ]),
    Patient.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: {
          path: "$doctor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          age: 1,
          gender: 1,
          condition: 1,
          email: 1,
          createdAt: 1,
          doctorId: {
            _id: "$doctor._id",
            name: "$doctor.name",
            specialization: "$doctor.specialization",
          },
        },
      },
    ]),
    Doctor.aggregate([
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "doctorId",
          as: "patients",
        },
      },
      {
        $project: {
          doctorId: "$_id",
          name: 1,
          specialization: 1,
          hospital: 1,
          patientCount: { $size: "$patients" },
        },
      },
      { $sort: { patientCount: -1, name: 1 } },
      { $limit: 8 },
    ]),
    Patient.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Patient.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Doctor.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Doctor.aggregate([
      { $group: { _id: "$specialization" } },
      { $count: "count" },
    ]),
  ]);

  const avgPatientsPerDoctor =
    totalDoctors > 0 ? Number((totalPatients / totalDoctors).toFixed(2)) : 0;

  const specializationsCount = specializationsCountAgg[0]?.count ?? 0;

  // Build continuous 14-day series so trends chart always renders cleanly
  const dailyMap = new Map<string, number>();
  for (const item of dailyTrendAgg as Array<{ _id: string; count: number }>) {
    dailyMap.set(item._id, item.count);
  }

  const registrationTrends: Array<{ date: string; label: string; count: number }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(fourteenDaysAgo.getDate() + i);
    const isoDate = d.toISOString().slice(0, 10);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    registrationTrends.push({
      date: isoDate,
      label,
      count: dailyMap.get(isoDate) ?? 0,
    });
  }

  // Build continuous 6-month series
  const monthlyPatientMap = new Map<string, number>();
  for (const item of monthlyPatientsAgg as Array<{ _id: { year: number; month: number }; count: number }>) {
    monthlyPatientMap.set(`${item._id.year}-${item._id.month}`, item.count);
  }

  const monthlyDoctorMap = new Map<string, number>();
  for (const item of monthlyDoctorsAgg as Array<{ _id: { year: number; month: number }; count: number }>) {
    monthlyDoctorMap.set(`${item._id.year}-${item._id.month}`, item.count);
  }

  const monthlyStats: Array<{ month: string; label: string; patients: number; doctors: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month}`;
    monthlyStats.push({
      month: `${year}-${String(month).padStart(2, "0")}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${year}`,
      patients: monthlyPatientMap.get(key) ?? 0,
      doctors: monthlyDoctorMap.get(key) ?? 0,
    });
  }

  return sendSuccess(res, 200, {
    summary: {
      totalDoctors,
      totalPatients,
      avgPatientsPerDoctor,
      specializationsCount,
    },
    recentDoctors,
    recentPatients,
    registrationTrends,
    doctorDistribution,
    monthlyStats,
  });
});

