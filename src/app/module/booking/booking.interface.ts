import { AppointmentStatus, PaymentStatus } from "../../../generated/prisma";

export interface ICreateBookingPayload {
  mentorId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface IUpdateBookingPayload {
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  startTime?: string;
  endTime?: string;
  notes?: string;
  meetingLink?: string;
}
