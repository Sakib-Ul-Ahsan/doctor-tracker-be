export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Doctor Tracker API",
    version: "1.0.0",
    description:
      "Enterprise Clinical Operations & Administration API for managing doctors, patients, medical conditions, and clinical activities.",
    contact: {
      name: "Doctor Tracker Engineering",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Default API Base (Relative / Current Origin)",
    },
    {
      url: "https://doctor-tracker-be-z4sm.onrender.com/api",
      description: "Render Production Server",
    },
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Auth", description: "Admin authentication & session management" },
    { name: "Doctors", description: "Doctor directory management & caseload tracking" },
    { name: "Patients", description: "Patient records, clinical assignments & history" },
    { name: "Dashboard", description: "Analytics, caseload distribution & audit trails" },
    { name: "Health", description: "System status & database diagnostics" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT Bearer token passed in the `Authorization` header",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "auth_token",
        description: "HttpOnly session cookie",
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
          data: { type: "object" },
          meta: {
            $ref: "#/components/schemas/PaginationMeta",
          },
        },
      },
      ApiResponseError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error description" },
          code: { type: "string", example: "BAD_REQUEST" },
          details: { type: "object" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
        },
      },
      Admin: {
        type: "object",
        properties: {
          id: { type: "string", example: "67344937d7a8d5696d5e7a91" },
          name: { type: "string", example: "Clinical Administrator" },
          email: { type: "string", format: "email", example: "admin@doctortracker.local" },
          role: { type: "string", example: "admin" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@doctortracker.local" },
          password: { type: "string", format: "password", example: "AdminSecret123!" },
        },
      },
      Doctor: {
        type: "object",
        properties: {
          _id: { type: "string", example: "67344937d7a8d5696d5e7b10" },
          name: { type: "string", example: "Dr. Sarah Jenkins" },
          specialization: { type: "string", example: "Cardiology" },
          hospital: { type: "string", example: "Mount Sinai Hospital" },
          phone: { type: "string", example: "+1-555-0199" },
          email: { type: "string", format: "email", example: "s.jenkins@mountsinai.org" },
          patientCount: { type: "integer", example: 8 },
          createdAt: { type: "string", format: "date-time", example: "2026-11-01T10:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-11-10T12:00:00.000Z" },
        },
      },
      CreateDoctorInput: {
        type: "object",
        required: ["name", "specialization", "hospital", "phone", "email"],
        properties: {
          name: { type: "string", example: "Dr. Sarah Jenkins" },
          specialization: { type: "string", example: "Cardiology" },
          hospital: { type: "string", example: "Mount Sinai Hospital" },
          phone: { type: "string", example: "+1-555-0199" },
          email: { type: "string", format: "email", example: "s.jenkins@mountsinai.org" },
        },
      },
      UpdateDoctorInput: {
        type: "object",
        properties: {
          name: { type: "string", example: "Dr. Sarah Jenkins-Smith" },
          specialization: { type: "string", example: "Cardiology" },
          hospital: { type: "string", example: "Metropolitan Hospital" },
          phone: { type: "string", example: "+1-555-0199" },
          email: { type: "string", format: "email", example: "s.jenkins@mountsinai.org" },
        },
      },
      Patient: {
        type: "object",
        properties: {
          _id: { type: "string", example: "67344937d7a8d5696d5e7c22" },
          name: { type: "string", example: "Robert Martinez" },
          age: { type: "integer", example: 48 },
          gender: { type: "string", enum: ["Male", "Female", "Other"], example: "Male" },
          phone: { type: "string", example: "+1-555-0321" },
          email: { type: "string", format: "email", example: "r.martinez@example.com" },
          condition: { type: "string", example: "Arrhythmia" },
          doctorId: {
            type: "object",
            properties: {
              _id: { type: "string", example: "67344937d7a8d5696d5e7b10" },
              name: { type: "string", example: "Dr. Sarah Jenkins" },
              specialization: { type: "string", example: "Cardiology" },
              hospital: { type: "string", example: "Mount Sinai Hospital" },
            },
          },
          createdAt: { type: "string", format: "date-time", example: "2026-11-05T08:30:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-11-05T08:30:00.000Z" },
        },
      },
      CreatePatientInput: {
        type: "object",
        required: ["name", "age", "gender", "phone", "email", "condition", "doctorId"],
        properties: {
          name: { type: "string", example: "Robert Martinez" },
          age: { type: "integer", example: 48 },
          gender: { type: "string", enum: ["Male", "Female", "Other"], example: "Male" },
          phone: { type: "string", example: "+1-555-0321" },
          email: { type: "string", format: "email", example: "r.martinez@example.com" },
          condition: { type: "string", example: "Arrhythmia" },
          doctorId: { type: "string", example: "67344937d7a8d5696d5e7b10" },
        },
      },
      UpdatePatientInput: {
        type: "object",
        properties: {
          name: { type: "string", example: "Robert Martinez" },
          age: { type: "integer", example: 49 },
          gender: { type: "string", enum: ["Male", "Female", "Other"], example: "Male" },
          phone: { type: "string", example: "+1-555-0321" },
          email: { type: "string", format: "email", example: "r.martinez@example.com" },
          condition: { type: "string", example: "Cardiac Arrhythmia - Controlled" },
          doctorId: { type: "string", example: "67344937d7a8d5696d5e7b10" },
        },
      },
      BulkDeleteInput: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: {
            type: "array",
            items: { type: "string" },
            example: ["67344937d7a8d5696d5e7b10", "67344937d7a8d5696d5e7b11"],
          },
        },
      },
      Activity: {
        type: "object",
        properties: {
          _id: { type: "string", example: "67344937d7a8d5696d5e7d44" },
          type: {
            type: "string",
            enum: [
              "doctor_created",
              "doctor_updated",
              "doctor_deleted",
              "patient_created",
              "patient_updated",
              "patient_deleted",
              "patient_reassigned",
            ],
            example: "patient_created",
          },
          description: {
            type: "string",
            example: "Registered new patient Robert Martinez under Dr. Sarah Jenkins",
          },
          entityType: { type: "string", enum: ["doctor", "patient"], example: "patient" },
          entityId: { type: "string", example: "67344937d7a8d5696d5e7c22" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      DashboardStats: {
        type: "object",
        properties: {
          summary: {
            type: "object",
            properties: {
              totalDoctors: { type: "integer", example: 12 },
              totalPatients: { type: "integer", example: 84 },
              avgPatientsPerDoctor: { type: "number", example: 7.0 },
              specializationsCount: { type: "integer", example: 6 },
            },
          },
          recentDoctors: {
            type: "array",
            items: { $ref: "#/components/schemas/Doctor" },
          },
          recentPatients: {
            type: "array",
            items: { $ref: "#/components/schemas/Patient" },
          },
          registrationTrends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", example: "2026-11-01" },
                label: { type: "string", example: "Nov 1" },
                count: { type: "integer", example: 5 },
              },
            },
          },
          doctorDistribution: {
            type: "array",
            items: {
              type: "object",
              properties: {
                doctorId: { type: "string" },
                name: { type: "string" },
                specialization: { type: "string" },
                hospital: { type: "string" },
                patientCount: { type: "integer" },
              },
            },
          },
          monthlyStats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                month: { type: "string", example: "2026-11" },
                label: { type: "string", example: "November" },
                patients: { type: "integer", example: 42 },
                doctors: { type: "integer", example: 4 },
              },
            },
          },
          activities: {
            type: "array",
            items: { $ref: "#/components/schemas/Activity" },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Service Health Diagnostics",
        description: "Returns uptime, database connection state, and deployment environment status.",
        responses: {
          200: {
            description: "Service is healthy and responsive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                        uptime: { type: "integer", example: 142 },
                        database: { type: "string", example: "connected" },
                        timestamp: { type: "string", format: "date-time" },
                        environment: { type: "string", example: "production" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Administrator Sign-In",
        description: "Authenticates an admin user, returns a signed JWT token, and sets an HttpOnly cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully authenticated",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "auth_token=<jwt>; HttpOnly; Secure; SameSite=None",
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
                        admin: { $ref: "#/components/schemas/Admin" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid email or password",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Sign Out",
        description: "Clears the authentication session and cookie.",
        responses: {
          200: {
            description: "Successfully logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        loggedOut: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get Current Administrator Profile",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: {
            description: "Admin profile retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        admin: { $ref: "#/components/schemas/Admin" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } },
            },
          },
        },
      },
    },
    "/doctors": {
      get: {
        tags: ["Doctors"],
        summary: "List Doctors with Caseloads",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, specialization, or hospital" },
          { name: "specialization", in: "query", schema: { type: "string" }, description: "Filter by exact specialization" },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Filter onboarding after date" },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "Filter onboarding before date" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Items per page" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "name", "specialization", "hospital"], default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
        ],
        responses: {
          200: {
            description: "Paginated doctors retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        doctors: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Doctor" },
                        },
                        specializations: {
                          type: "array",
                          items: { type: "string" },
                          example: ["Cardiology", "Neurology", "Pediatrics"],
                        },
                      },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Doctors"],
        summary: "Create New Physician",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateDoctorInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Doctor created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        doctor: { $ref: "#/components/schemas/Doctor" },
                      },
                    },
                  },
                },
              },
            },
          },
          409: {
            description: "Doctor email already registered",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } },
            },
          },
        },
      },
    },
    "/doctors/bulk-delete": {
      post: {
        tags: ["Doctors"],
        summary: "Bulk Delete Doctors",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkDeleteInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Bulk deletion result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        deletedCount: { type: "integer", example: 3 },
                        skippedDoctorsWithPatients: {
                          type: "array",
                          items: { type: "string" },
                          example: ["Dr. Sarah Jenkins"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/doctors/{id}": {
      get: {
        tags: ["Doctors"],
        summary: "Get Doctor Details",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Doctor MongoDB ObjectId" },
        ],
        responses: {
          200: {
            description: "Doctor details retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        doctor: { $ref: "#/components/schemas/Doctor" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Doctor not found" },
        },
      },
      patch: {
        tags: ["Doctors"],
        summary: "Update Doctor Profile",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Doctor MongoDB ObjectId" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateDoctorInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Doctor updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        doctor: { $ref: "#/components/schemas/Doctor" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Doctor not found" },
        },
      },
      delete: {
        tags: ["Doctors"],
        summary: "Delete Doctor (With Optional Patient Reassignment)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Doctor MongoDB ObjectId to delete" },
          { name: "reassignTo", in: "query", schema: { type: "string" }, description: "Target doctor ObjectId to safely inherit active patients" },
        ],
        responses: {
          200: {
            description: "Doctor deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        deletedId: { type: "string" },
                        reassignedPatientsCount: { type: "integer", example: 5 },
                        reassignedTo: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Doctor has active patients and no reassignTo doctor was specified" },
          404: { description: "Doctor or reassignTo doctor not found" },
        },
      },
    },
    "/doctors/{id}/patients": {
      get: {
        tags: ["Doctors"],
        summary: "List Patients Assigned to Doctor",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Doctor MongoDB ObjectId" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search patients by name or condition" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: {
            description: "Doctor's patients retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        patients: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Patient" },
                        },
                      },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/patients": {
      get: {
        tags: ["Patients"],
        summary: "List Clinical Patient Records",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Search patient by name, condition, or phone" },
          { name: "condition", in: "query", schema: { type: "string" }, description: "Filter by medical condition" },
          { name: "doctorId", in: "query", schema: { type: "string" }, description: "Filter by assigned doctor ID" },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "name", "age", "condition"], default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
        ],
        responses: {
          200: {
            description: "Paginated patient records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        patients: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Patient" },
                        },
                        conditions: {
                          type: "array",
                          items: { type: "string" },
                          example: ["Hypertension", "Type 2 Diabetes", "Asthma"],
                        },
                      },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Patients"],
        summary: "Register New Patient Record",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePatientInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Patient registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        patient: { $ref: "#/components/schemas/Patient" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Assigned doctor not found" },
        },
      },
    },
    "/patients/bulk-delete": {
      post: {
        tags: ["Patients"],
        summary: "Bulk Delete Patients",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkDeleteInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Bulk deletion completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        deletedCount: { type: "integer", example: 4 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/patients/{id}": {
      get: {
        tags: ["Patients"],
        summary: "Get Patient Details",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Patient MongoDB ObjectId" },
        ],
        responses: {
          200: {
            description: "Patient retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        patient: { $ref: "#/components/schemas/Patient" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Patient not found" },
        },
      },
      patch: {
        tags: ["Patients"],
        summary: "Update Patient Record",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Patient MongoDB ObjectId" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePatientInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Patient record updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        patient: { $ref: "#/components/schemas/Patient" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Patient or target doctor not found" },
        },
      },
      delete: {
        tags: ["Patients"],
        summary: "Delete Patient Record",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Patient MongoDB ObjectId" },
        ],
        responses: {
          200: {
            description: "Patient deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        deletedId: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Patient not found" },
        },
      },
    },
    "/dashboard/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "Comprehensive Dashboard Analytics",
        description: "Returns summary counts, registration trends, doctor patient distribution, monthly stats, and recent activity.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "days", in: "query", schema: { type: "integer", default: 14 }, description: "Registration trend window in days" },
        ],
        responses: {
          200: {
            description: "Analytics dataset",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DashboardStats" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard/activities": {
      get: {
        tags: ["Dashboard"],
        summary: "Recent System Activity Audit Log",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Max activities to return" },
        ],
        responses: {
          200: {
            description: "Activity feed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        activities: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Activity" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
