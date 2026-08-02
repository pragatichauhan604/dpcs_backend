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
    { name: "System" },
    { name: "Auth" },
    { name: "Public" },
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
          profilePhoto: {
            type: "string",
            description: "Optional JPG, PNG, or WebP data URL from the frontend file picker.",
            example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
          },
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
          appointmentId: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440010" },
          disease: { type: "string", example: "Fever" },
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
      AdminRegistration: {
        type: "object",
        required: ["fullName", "email", "password", "confirmPassword", "phone"],
        properties: {
          fullName: { type: "string", example: "DPCS Admin" },
          email: { type: "string", example: "admin@example.com" },
          password: { type: "string", example: "Admin1234" },
          confirmPassword: { type: "string", example: "Admin1234" },
          phone: { type: "string", example: "9999999999" },
        },
      },
      PharmacistRegistration: {
        type: "object",
        required: ["fullName", "email", "password", "confirmPassword", "phone", "pharmacyId", "licenseNumber"],
        properties: {
          fullName: { type: "string", example: "Pragati Chauhan" },
          email: { type: "string", example: "pharmacist@example.com" },
          password: { type: "string", example: "Pharma123" },
          confirmPassword: { type: "string", example: "Pharma123" },
          phone: { type: "string", example: "9876543210" },
          pharmacyId: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440005" },
          licenseNumber: { type: "string", example: "PHARMA12345" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", example: "patient@example.com" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "password", "confirmPassword"],
        properties: {
          email: { type: "string", example: "patient@example.com" },
          otp: { type: "string", example: "123456" },
          password: { type: "string", example: "NewPass123" },
          confirmPassword: { type: "string", example: "NewPass123" },
        },
      },
      AppointmentCreate: {
        type: "object",
        required: ["doctorId", "preferredDate", "reason"],
        properties: {
          doctorId: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440005" },
          preferredDate: { type: "string", format: "date", example: "2026-07-30" },
          reason: { type: "string", example: "Follow-up for fever treatment" },
        },
      },
      AppointmentSchedule: {
        type: "object",
        required: ["scheduledAt"],
        properties: {
          scheduledAt: { type: "string", format: "date-time", example: "2026-07-30T10:30:00.000Z" },
          doctorNote: { type: "string", example: "Please come to room 204 with previous reports." },
        },
      },
      PharmacyCreate: {
        type: "object",
        required: ["name", "ownerName", "licenseNumber", "address", "city", "pincode", "latitude", "longitude", "phone"],
        properties: {
          name: { type: "string", example: "DPCS Test Pharmacy" },
          ownerName: { type: "string", example: "Pragati Chauhan" },
          licenseNumber: { type: "string", example: "TEST-PHARMACY-001" },
          address: { type: "string", example: "Main Road, Sector 12" },
          city: { type: "string", example: "Noida" },
          pincode: { type: "string", example: "201301" },
          latitude: { type: "number", example: 28.5355 },
          longitude: { type: "number", example: 77.391 },
          phone: { type: "string", example: "9876543210" },
          email: { type: "string", example: "testpharmacy@dpcs.local" },
        },
      },
      MedicineUpsert: {
        type: "object",
        required: ["brandName", "genericName", "category", "dosageForms"],
        properties: {
          brandName: { type: "string", example: "Dolo 650" },
          genericName: { type: "string", example: "Paracetamol" },
          category: { type: "string", example: "Analgesic" },
          manufacturer: { type: "string", example: "Micro Labs" },
          dosageForms: { type: "string", example: "Tablet" },
          standardStrength: { type: "string", example: "650mg" },
          requiresPrescription: { type: "boolean", example: true },
          description: { type: "string", example: "Used for fever and pain relief." },
          isActive: { type: "boolean", example: true },
        },
      },
      InventoryUpsert: {
        type: "object",
        required: ["medicineId", "quantity"],
        properties: {
          medicineId: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440001" },
          quantity: { type: "integer", example: 50 },
          batchNumber: { type: "string", example: "BATCH-2026-01" },
          unitPrice: { type: "number", example: 24.5 },
          expiryDate: { type: "string", format: "date", example: "2027-12-31" },
          reorderLevel: { type: "integer", example: 10 },
        },
      },
      DispenseRequest: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Use one of the status values stored/validated by the backend: completed, partial, or rejected.",
            example: "completed",
          },
          notes: { type: "string", example: "All medicines dispensed." },
          partialReason: { type: "string", example: "One medicine was out of stock." },
        },
      },
      RefillResponse: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            description: "Use a value from refill_request_statuses: approved or rejected.",
            example: "approved",
          },
          doctorNote: { type: "string", example: "Approved for one refill. Please follow the same dosage." },
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
    "/api/auth/register/admin": {
      post: {
        tags: ["Auth"],
        summary: "Register admin",
        requestBody: jsonBody("AdminRegistration"),
        responses: created("Admin registered"),
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
        requestBody: jsonBody("PharmacistRegistration"),
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
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Generate password reset OTP",
        requestBody: jsonBody("ForgotPasswordRequest"),
        responses: ok("Password reset OTP generated"),
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        requestBody: jsonBody("ResetPasswordRequest"),
        responses: ok("Password reset successful"),
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
    "/api/public/prescriptions/qr/{token}/pdf": {
      get: {
        tags: ["Public"],
        summary: "Download prescription PDF from QR token",
        description: "Used by QR codes generated for new prescriptions. No login required.",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: pdfOk("Prescription PDF downloaded"),
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
    "/api/catalog/pharmacies": {
      get: {
        tags: ["Catalog"],
        summary: "List approved pharmacies",
        security: bearer(),
        parameters: queryParams([
          { name: "q", schema: { type: "string" } },
          { name: "city", schema: { type: "string" } },
        ]),
        responses: ok("Approved pharmacies returned"),
      },
    },
    "/api/catalog/availability": {
      get: {
        tags: ["Catalog"],
        summary: "Medicine availability by pharmacy",
        security: bearer(),
        parameters: queryParams([
          { name: "medicineId", schema: { type: "string" } },
          { name: "q", schema: { type: "string" } },
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
    "/api/doctor/patients": route("Doctor", "Doctor patients"),
    "/api/doctor/appointments/{id}/schedule": {
      post: {
        tags: ["Doctor"],
        summary: "Schedule appointment request",
        security: bearer(),
        parameters: pathId(),
        requestBody: jsonBody("AppointmentSchedule"),
        responses: ok("Appointment scheduled"),
      },
    },
    "/api/doctor/refill-requests": {
      get: {
        tags: ["Doctor"],
        summary: "List refill requests",
        description: "Returns patient refill requests for the logged-in doctor with requested, approved, or rejected status.",
        security: bearer(),
        responses: ok("Refill requests returned"),
      },
    },
    "/api/doctor/refill-requests/{id}": {
      patch: {
        tags: ["Doctor"],
        summary: "Approve or reject refill request",
        security: bearer(),
        parameters: pathId(),
        requestBody: jsonBody("RefillResponse"),
        responses: ok("Refill request reviewed and patient notified"),
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
    "/api/doctor/prescriptions/{id}": {
      patch: {
        tags: ["Doctor"],
        summary: "Edit prescription within allowed time",
        description: "Doctors can edit a prescription only within the configured edit window, default 30 minutes, and not after it is dispensed.",
        security: bearer(),
        parameters: pathId(),
        requestBody: jsonBody("PrescriptionCreate"),
        responses: ok("Prescription updated"),
      },
    },
    "/api/patient/dashboard": route("Patient", "Patient dashboard"),
    "/api/patient/doctors": {
      get: {
        tags: ["Patient"],
        summary: "List/search approved doctors",
        description: "Search can match doctor name, specialization, hospital, city, or disease from the patient's issued prescriptions.",
        security: bearer(),
        parameters: queryParams([{ name: "q", schema: { type: "string" } }]),
        responses: ok("Doctors returned"),
      },
    },
    "/api/patient/appointments": {
      post: {
        tags: ["Patient"],
        summary: "Request doctor appointment",
        security: bearer(),
        requestBody: jsonBody("AppointmentCreate"),
        responses: created("Appointment request created"),
      },
    },
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
    "/api/patient/prescriptions/{id}/pdf": {
      get: {
        tags: ["Patient"],
        summary: "Download prescription PDF",
        security: bearer(),
        parameters: pathId(),
        responses: pdfOk("Prescription PDF downloaded"),
      },
    },
    "/api/patient/prescriptions/{id}/order-link": {
      get: {
        tags: ["Patient"],
        summary: "Get partner medicine order link",
        security: bearer(),
        parameters: pathId(),
        responses: ok("Order link returned"),
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
    "/api/pharmacy/dashboard": route("Pharmacy", "Pharmacy dashboard"),
    "/api/pharmacy/prescriptions/scan/{token}": {
      get: {
        tags: ["Pharmacy"],
        summary: "Scan QR token or QR PDF link",
        description: "Accepts a raw QR token or the generated QR PDF link. URL-encode full links before passing them in the path.",
        security: bearer(),
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: ok("Prescription returned"),
      },
    },
    "/api/pharmacy/prescriptions/{id}/pdf": {
      get: {
        tags: ["Pharmacy"],
        summary: "Download scanned prescription PDF",
        security: bearer(),
        parameters: pathId(),
        responses: pdfOk("Prescription PDF downloaded"),
      },
    },
    "/api/pharmacy/prescriptions/{id}/dispense": {
      post: {
        tags: ["Pharmacy"],
        summary: "Mark prescription dispensed",
        security: bearer(),
        parameters: pathId(),
        requestBody: jsonBody("DispenseRequest"),
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
        requestBody: jsonBody("InventoryUpsert"),
        responses: created("Inventory record created"),
      },
    },
    "/api/pharmacy/inventory/{id}": {
      patch: {
        tags: ["Pharmacy"],
        summary: "Update inventory record",
        security: bearer(),
        parameters: pathId(),
        requestBody: jsonBody("InventoryUpsert"),
        responses: ok("Inventory record updated"),
      },
    },
    "/api/admin/dashboard": route("Admin", "Admin dashboard"),
    "/api/admin/doctors": route("Admin", "List doctors"),
    "/api/admin/doctors/{id}/approval": approvalRoute("Admin", "Approve or suspend doctor"),
    "/api/admin/patients": route("Admin", "List patients"),
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
        requestBody: jsonBody("PharmacyCreate"),
        responses: created("Pharmacy created"),
      },
    },
    "/api/admin/pharmacies/{id}/approval": approvalRoute("Admin", "Approve or suspend pharmacy"),
    "/api/admin/pharmacists": route("Admin", "List pharmacists"),
    "/api/admin/pharmacists/{id}/approval": approvalRoute("Admin", "Approve or suspend pharmacist"),
    "/api/admin/prescriptions": route("Admin", "List prescriptions"),
    "/api/admin/medicines": {
      post: {
        tags: ["Admin"],
        summary: "Add medicine to master list",
        security: bearer(),
        requestBody: jsonBody("MedicineUpsert"),
        responses: created("Medicine created"),
      },
    },
    "/api/admin/medicines/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update medicine in master list",
        security: bearer(),
        parameters: pathId(),
        requestBody: jsonBody("MedicineUpsert"),
        responses: ok("Medicine updated"),
      },
    },
    "/api/admin/reports/audit-logs": route("Admin", "Audit logs report"),
    "/api/admin/reports/summary": route("Admin", "Admin analytics report summary"),
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

function pdfOk(description: string) {
  return {
    "200": {
      description,
      content: {
        "application/pdf": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
    "401": { description: "Unauthorized" },
    "403": { description: "Access denied" },
    "404": { description: "Not found" },
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
