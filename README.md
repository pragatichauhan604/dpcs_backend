# DPCS Backend

Express API for the Digital Prescription and Pharmacy Coordination System.

## Stack

- Node.js + Express
- MySQL + Prisma
- JWT authentication
- bcrypt password hashing
- Zod validation
- QR code generation
- Swagger API documentation

## Folder Structure

```text
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    config/
    lib/
    middleware/
    routes/
    utils/
    validators/
    app.ts
    server.ts
```

## Setup

1. Create a MySQL database named `dpcs`.
2. Copy `.env.example` to `.env`.
3. Update `DATABASE_URL`, `JWT_SECRET`, and admin credentials.
4. Install dependencies:

```bash
npm install
```

5. Run migrations and seed data:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

6. Start the API:

```bash
npm run dev
```

## URLs

- API health: `http://localhost:4000/health`
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/docs.json`

## Database Design

The project uses MySQL lookup tables instead of enums.

Lookup tables include:

- `user_roles`
- `genders`
- `prescription_statuses`
- `medicine_frequencies`
- `medicine_timings`
- `dispense_statuses`
- `alert_types`
- `notification_types`

Run `npm run prisma:seed` after migration so these tables are populated before registration and prescription workflows.

## Useful Scripts

```bash
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

## Main Routes

- `POST /api/auth/register/doctor`
- `POST /api/auth/register/patient`
- `POST /api/auth/register/pharmacist`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/doctor/dashboard`
- `POST /api/doctor/prescriptions`
- `GET /api/patient/prescriptions`
- `GET /api/patient/prescriptions/:id/qr`
- `GET /api/pharmacy/prescriptions/scan/:token`
- `POST /api/pharmacy/prescriptions/:id/dispense`
- `GET /api/admin/dashboard`
- `PATCH /api/admin/doctors/:id/approval`
- # `PATCH /api/admin/pharmacies/:id/approval`

# dpcs_backend

