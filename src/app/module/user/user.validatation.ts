import z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const createDoctorZodSchema = z.object({
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters long"),
  doctor: z.object({
    name: z.string("Name is required").min(1, "Name is required"),
    email: z.string("Email is required").email("Invalid email"),
    profilePhoto: z
      .string("Profile photo is required")
      .min(1, "Profile photo is required"),
    contactNumber: z
      .string("Contact number is required")
      .min(11, "Contact number must be at least 11 digits")
      .max(14, "contact number must be 11 to 14 digits"),
    address: z.string("Address is required").min(1, "Address is required"),
    registrationNumber: z
      .string("Registration number is required")
      .min(5, "Registration number must be at least 5 digits"),
    experience: z
      .number("Experience is required")
      .min(0, "Experience must be at least 0 years"),
    appointmentFee: z
      .number("Appointment fee is required")
      .min(0, "Appointment fee must be at least 0"),
    gender: z.enum(
      [Gender.MALE, Gender.FEMALE],
      "Gender must be male or female",
    ),
    qualification: z
      .string("Qualification is required")
      .min(1, "Qualification is required"),
    currentWorkplace: z
      .string("Current workplace is required")
      .min(1, "Current workplace is required"),
    designation: z
      .string("Designation is required")
      .min(1, "Designation is required"),
  }),
  specialties: z.array(
    z
      .uuid("Speciality ID is required")
      .min(1, "At least one speciality is required"),
  ),
});
