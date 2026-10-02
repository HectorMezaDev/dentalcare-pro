# Documentación DentalCare Pro

## 1. Arquitectura General
El sistema sigue una arquitectura de **N-Capas** desacoplada:
- **Capa de Presentación (Frontend):** React + Vite + Tailwind CSS. Comunicación vía REST API.
- **Capa de Aplicación (Backend):** Node.js + Express + TypeScript. Maneja lógica de negocio, validaciones y seguridad.
- **Capa de Datos (Persistencia):** Prisma ORM sobre PostgreSQL (SQLite para demo).
- **Capa de Seguridad:** JWT para autenticación y RBAC para autorización.

### Diagrama de Flujo
`Usuario -> Frontend (React) -> API Gateway (Express Middleware) -> Controladores -> Prisma ORM -> Base de Datos`

## 2. Diseño de Base de Datos (PostgreSQL DDL)
```sql
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ATTENDED', 'CANCELLED');

CREATE TABLE "Employee" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentId" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" DEFAULT 'RECEPTIONIST',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Patient" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentNumber" TEXT UNIQUE NOT NULL,
    "birthDate" DATE NOT NULL,
    "doctorId" UUID REFERENCES "Employee"("id"),
    "isActive" BOOLEAN DEFAULT true
);

CREATE TABLE "Appointment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" TIMESTAMP NOT NULL,
    "status" "AppointmentStatus" DEFAULT 'SCHEDULED',
    "patientId" UUID REFERENCES "Patient"("id"),
    "doctorId" UUID REFERENCES "Employee"("id")
);
-- Índices para optimización
CREATE INDEX idx_appointment_date ON "Appointment"("date");
CREATE INDEX idx_patient_doc ON "Patient"("documentNumber");
```

## 3. Matriz de Permisos (RBAC)
| Acción | Admin | Doctor | Recepcionista | Enfermero |
|---|---|---|---|---|
| Gestionar Empleados | ✅ | ❌ | ❌ | ❌ |
| Crear/Editar Pacientes | ✅ | ❌ | ✅ | ❌ |
| Ver Historias Clínicas | ✅ | ✅ | ❌ | ✅ |
| Agendar Citas | ✅ | ✅ | ✅ | ❌ |
| Emitir Recetas | ✅ | ✅ | ❌ | ❌ |
| Ver Reportes Financieros| ✅ | ❌ | ❌ | ❌ |

## 4. Reglas de Negocio
- **Integridad Referencial:** No se permite eliminar un paciente si tiene citas históricas (se aplica Soft Delete).
- **Estados de Cita:** Una cita solo puede pasar a `ATTENDED` si la fecha es hoy o anterior. Solo `ADMIN` puede reabrir una cita cancelada.
- **Recetas:** El correlativo es único y secuencial. No se pueden editar recetas después de 24 horas de su creación.

## 5. Reportes (Consultas SQL)
### Productividad por Odontólogo
```sql
SELECT e.lastName, COUNT(a.id) as total_citas
FROM "Employee" e
JOIN "Appointment" a ON e.id = a.doctorId
WHERE a.status = 'ATTENDED' AND a.date >= NOW() - INTERVAL '30 days'
GROUP BY e.id;
```

## 6. Configuración Local (PostgreSQL Instalado)

Si tienes PostgreSQL instalado directamente en tu computadora (sin Docker), sigue estos pasos:

### Requisitos Previos
- PostgreSQL instalado y corriendo.
- pgAdmin instalado (opcional, para ver los datos).

### Pasos para Iniciar
1. **Crear la Base de Datos:**
   Abre pgAdmin o tu terminal de PostgreSQL y crea una base de datos llamada `dentalcare_db`.

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   # Cambia 'postgres:postgres' por tu usuario y contraseña de PostgreSQL
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/dentalcare_db?schema=public"
   JWT_SECRET="tu_secreto_seguro"
   ```

4. **Sincronizar la Base de Datos:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
   ```

5. **Correr la Aplicación:**
   ```bash
   npm run dev
   ```

## 7. Migración a Supabase

Para migrar a Supabase, simplemente cambia la `DATABASE_URL` en tu archivo `.env` por la URL que te proporciona Supabase en su panel de configuración y vuelve a ejecutar las migraciones.
