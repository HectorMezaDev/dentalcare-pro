import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Admin
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@dentalcare.com' },
    update: {},
    create: {
      email: 'admin@dentalcare.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      documentId: '00000000',
      role: 'ADMIN',
    }
  });

  // Doctor
  const doctor = await prisma.employee.upsert({
    where: { email: 'doctor@dentalcare.com' },
    update: {},
    create: {
      email: 'doctor@dentalcare.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      documentId: '11111111',
      role: 'DOCTOR',
    }
  });

  // Procedure Types
  await prisma.procedureType.upsert({
    where: { name: 'Limpieza Dental' },
    update: {},
    create: { name: 'Limpieza Dental', price: 50.0, description: 'Limpieza profunda de sarro y placa.' }
  });

  // Patient
  const patient = await prisma.patient.upsert({
    where: { documentNumber: '12345678' },
    update: {},
    create: {
      firstName: 'María',
      lastName: 'García',
      documentType: 'DNI',
      documentNumber: '12345678',
      birthDate: new Date('1990-05-15'),
      gender: 'Femenino',
      phone: '555-0199',
      email: 'maria@example.com',
      doctorId: doctor.id
    }
  });

  // Appointment
  await prisma.appointment.create({
    data: {
      date: new Date(),
      type: 'CONSULTATION',
      description: 'Revisión general',
      patientId: patient.id,
      doctorId: doctor.id,
      status: 'SCHEDULED'
    }
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
