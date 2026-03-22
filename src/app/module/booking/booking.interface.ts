export interface ICreateBookingPayload {
  mentorId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface IUpdateBookingPayload {
  status?: "SCHEDULED" | "INPROGRESS" | "COMPLETED" | "CANCELED";
  paymentStatus?: "UNPAID" | "PAID";
  startTime?: string;
  endTime?: string;
  notes?: string;
}
