import { DayOfWeek } from "../../../generated/prisma/enums";

export interface ICreateSchedulePayload {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}
