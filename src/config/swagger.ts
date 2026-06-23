export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "DPCS API",
    version: "1.0.0",
    description: "Digital Prescription and Pharmacy Coordination System backend API.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Auth" },
    { name: "Doctor" },
    { name: "Patient" },
    { name: "Pharmacy" },
    { name: "Admin" },
    { name: "Catalog" },
    { name: "Notifications" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@dpcs.local" },
          password: { type: "string", example: "Admin1234" },
          role: { type: "string", example: "admin" },
          rememberMe: { type: "boolean", example: true },
        },
      },
      DoctorRegistration: {
        type: "object",
        required: [
          "fullName",
          "email",
          "password",
          "confirmPassword",
          "phone",
          "licenseNumber",
          "specialization",
          "hospitalName",
          "hospitalAddress",
          "city",
          "pincode",
        ],
        properties: {
          fullName: { type: "string", example: "Dr. Kavya Sharma" },
          email: { type: "string", example: "doctor@example.com" },
          password: { type: "string", example: "Doctor123" },
          confirmPassword: { type: "string", example: "Doctor123" },
          phone: { type: "string", example: "9876543210" },
          licenseNumber: { type: "string", example: "MED12345" },
          specialization: { type: "string", example: "General Physician" },
          hospitalName: { type: "string", example: "Metro Clinic" },
          hospitalAddress: { type: "string", example: "Sector 12 Main Road" },
          city: { type: "string", example: "Noida" },
          pincode: { type: "string", example: "201301" },
        },
      },
      PatientRegistration: {
        type: "object",
        required: [
          "fullName",
          "email",
          "password",
          "confirmPassword",
          "phone",
          "dateOfBirth",
          "gender",
          "address",
          "city",
          "pincode",
        ],
        properties: {
          fullName: { type: "string", example: "Aarav Mehta" },
          email: { type: "string", example: "patient@example.com" },
          password: { type: "string", example: "Patient123" },
          confirmPassword: { type: "string", example: "Patient123" },
          phone: { type: "string", example: "9876543210" },
          dateOfBirth: { type: "string", format: "date", example: "2000-01-15" },
          gender: { type: "string", example: "male" },
          bloodGroup: { type: "string", example: "O+" },
          address: { type: "string", example: "Sector 15" },
          city: { type: "string", example: "Noida" },
          pincode: { type: "string", example: "201301" },
        },
      },
      PrescriptionCreate: {
        type: "object",
        required: ["patientId", "items"],
        properties: {
          patientId: { type: "string", example: "uuid" },
          notes: { type: "string", example: "Rest and hydration advised." },
          expiryDate: { type: "string", format: "date" },
          followUpDate: { type: "string", format: "date" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["medicineName", "dosage", "frequency", "durationDays"],
              properties: {
                medicineId: { type: "string", example: "uuid" },
                medicineName: { type: "string", example: "Dolo 650" },
                dosage: { type: "string", example: "650mg" },
                frequency: { type: "string", example: "twice_daily" },
                durationDays: { type: "integer", example: 3 },
                timing: { type: "string", example: "after_food" },
                quantityToTake: { type: "string", example: "1 tablet" },
                instructions: { type: "string", example: "Avoid alcohol." },
              },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Validation failed" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: { "200": { description: "API is running" } },
      },
    },
    "/api/auth/register/doctor": {
      post: {
        tags: ["Auth"],
        summary: "Register doctor",
        requestBody: jsonBody("DoctorRegistration"),
        responses: created("Doctor registered"),
      },
    },
    "/api/auth/register/patient": {
      post: {
        tags: ["Auth"],
        summary: "Register patient",
        requestBody: jsonBody("PatientRegistration"),
        responses: created("Patient registered"),
      },
    },
    "/api/auth/register/pharmacist": {
      post: {
        tags: ["Auth"],
        summary: "Register pharmacist",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "email", "password", "confirmPassword", "phone", "pharmacyId", "licenseNumber"],
                properties: {
                  fullName: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  confirmPassword: { type: "string" },
                  phone: { type: "string" },
                  pharmacyId: { type: "string" },
                  licenseNumber: { type: "string" },
                },
              },
            },
          },
        },
        responses: created("Pharmacist registered"),
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: jsonBody("LoginRequest"),
        responses: ok("Login successful"),
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: bearer(),
        responses: ok("Current user returned"),
      },
    },
    "/api/catalog/medicines": {
      get: {
        tags: ["Catalog"],
        summary: "Search medicines",
        security: bearer(),
        parameters: queryParams([{ name: "q", schema: { type: "string" } }]),
        responses: ok("Medicine list returned"),
      },
    },
    "/api/catalog/availability": {
      get: {
        tags: ["Catalog"],
        summary: "Medicine availability by pharmacy",
        security: bearer(),
        parameters: queryParams([
          { name: "medicineId", schema: { type: "string" } },
          { name: "city", schema: { type: "string" } },
        ]),
        responses: ok("Inventory availability returned"),
      },
    },
    "/api/doctor/dashboard": route("Doctor", "Doctor dashboard"),
    "/api/doctor/patients/search": {
      get: {
        tags: ["Doctor"],
        summary: "Search patients",
        security: bearer(),
        parameters: queryParams([{ name: "q", schema: { type: "string" } }]),
        responses: ok("Patient matches returned"),
      },
    },
    "/api/doctor/prescriptions": {
      get: {
        tags: ["Doctor"],
        summary: "Doctor prescription history",
        security: bearer(),
        responses: ok("Prescriptions returned"),
      },
      post: {
        tags: ["Doctor"],
        summary: "Create prescription and QR code",
        security: bearer(),
        requestBody: jsonBody("PrescriptionCreate"),
        responses: created("Prescription created"),
      },
    },
    "/api/patient/dashboard": route("Patient", "Patient dashboard"),
    "/api/patient/prescriptions": route("Patient", "Patient prescriptions"),
    "/api/patient/prescriptions/{id}/qr": {
      get: {
        tags: ["Patient"],
        summary: "Get prescription QR code",
        security: bearer(),
        parameters: pathId(),
        responses: ok("QR code returned"),
      },
    },
    "/api/patient/prescriptions/{id}/refill-request": {
      post: {
        tags: ["Patient"],
        summary: "Request refill",
        security: bearer(),
        parameters: pathId(),
        responses: created("Refill request created"),
      },
    },
    "/api/pharmacy/prescriptions/scan/{token}": {
      get: {
        tags: ["Pharmacy"],
        summary: "Scan QR token",
        security: bearer(),
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: ok("Prescription returned"),
      },
    },
    "/api/pharmacy/prescriptions/{id}/dispense": {
      post: {
        tags: ["Pharmacy"],
        summary: "Mark prescription dispensed",
        security: bearer(),
        parameters: pathId(),
        responses: created("Dispense record created"),
      },
    },
    "/api/pharmacy/inventory": {
      get: {
        tags: ["Pharmacy"],
        summary: "Pharmacy inventory",
        security: bearer(),
        responses: ok("Inventory returned"),
      },
      post: {
        tags: ["Pharmacy"],
        summary: "Add inventory record",
        security: bearer(),
        responses: created("Inventory record created"),
      },
    },
    "/api/admin/dashboard": route("Admin", "Admin dashboard"),
    "/api/admin/doctors": route("Admin", "List doctors"),
    "/api/admin/doctors/{id}/approval": approvalRoute("Admin", "Approve or suspend doctor"),
    "/api/admin/pharmacies": {
      get: {
        tags: ["Admin"],
        summary: "List pharmacies",
        security: bearer(),
        responses: ok("Pharmacies returned"),
      },
      post: {
        tags: ["Admin"],
        summary: "Create pharmacy",
        security: bearer(),
        responses: created("Pharmacy created"),
      },
    },
    "/api/admin/pharmacies/{id}/approval": approvalRoute("Admin", "Approve or suspend pharmacy"),
    "/api/admin/medicines": {
      post: {
        tags: ["Admin"],
        summary: "Add medicine to master list",
        security: bearer(),
        responses: created("Medicine created"),
      },
    },
    "/api/notifications": route("Notifications", "User notifications"),
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        security: bearer(),
        parameters: pathId(),
        responses: ok("Notification updated"),
      },
    },
  },
};

function bearer() {
  return [{ bearerAuth: [] }];
}

function jsonBody(schemaName: string) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

function ok(description: string) {
  return {
    "200": { description },
    "401": { description: "Unauthorized" },
    "403": { description: "Access denied" },
    "500": { description: "Internal server error" },
  };
}

function created(description: string) {
  return {
    "201": { description },
    "400": { description: "Bad request" },
    "422": { description: "Validation failed" },
    "500": { description: "Internal server error" },
  };
}

function pathId() {
  return [{ name: "id", in: "path", required: true, schema: { type: "string" } }];
}

function queryParams(params: { name: string; schema: { type: string } }[]) {
  return params.map((param) => ({ ...param, in: "query", required: false }));
}

function route(tag: string, summary: string) {
  return {
    get: {
      tags: [tag],
      summary,
      security: bearer(),
      responses: ok(`${summary} returned`),
    },
  };
}

function approvalRoute(tag: string, summary: string) {
  return {
    patch: {
      tags: [tag],
      summary,
      security: bearer(),
      parameters: pathId(),
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["isApproved"],
              properties: { isApproved: { type: "boolean" } },
            },
          },
        },
      },
      responses: ok("Approval updated"),
    },
  };
}
