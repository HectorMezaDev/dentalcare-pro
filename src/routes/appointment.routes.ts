import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticate, authorize } from "../middlewares/auth";
import { logAudit } from "../services/auditService";
import { z } from "zod";

const router = Router();

const appointmentSchema = z.object({
  date: z.string().transform(val => new Date(val)),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  type: z.string(),
  description: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "ATTENDED", "CANCELLED"]).optional(),
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { doctorId, patientId, date, status } = req.query;
    const where: any = {};
    if (doctorId) where.doctorId = String(doctorId);
    if (patientId) where.patientId = String(patientId);
    if (status) where.status = status;
    if (date) {
      const start = new Date(String(date));
      start.setHours(0, 0, 0, 0);
      const end = new Date(String(date));
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, async (req: any, res, next) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const appointment = await prisma.appointment.create({ 
      data: { 
        date: data.date,
        type: data.type,
        description: data.description,
        status: data.status,
        patient: { connect: { id: data.patientId } },
        doctor: { connect: { id: data.doctorId } }
      } 
    });
    await logAudit("CREATE", "Appointment", appointment.id, req.user.id);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", authenticate, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { status, diagnosis, treatment, observations } = req.body;
    
    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: "Cita no encontrada" });

    // Regla de negocio: solo puede pasar a ATTENDED si la fecha es hoy o anterior
    if (status === "ATTENDED" && new Date(current.date) > new Date()) {
      return res.status(400).json({ error: "No se puede marcar como atendida una cita futura" });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status, diagnosis, treatment, observations }
    });

    await logAudit("UPDATE", "Appointment", id, req.user.id, `Status: ${status}`);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

export default router;
