import { Role } from "../../generated/prisma";

export interface IRequestUser {
  userId: string;
  role: Role;
  email: string;
}
