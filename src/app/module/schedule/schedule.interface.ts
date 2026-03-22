import { DayOfWeek } from "../../../generated/prisma";

export interface ICreateSchedulePayload {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}
