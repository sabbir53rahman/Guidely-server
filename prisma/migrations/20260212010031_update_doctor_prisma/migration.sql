/*
  Warnings:

  - Added the required column `currentWorkplace` to the `doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "doctor" ADD COLUMN     "currentWorkplace" TEXT NOT NULL;
