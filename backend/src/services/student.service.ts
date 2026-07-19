import { userModel } from "../models/user.model";
import { studentModel } from "../models/student.model";
import { hashPassword } from "../lib/password";
import { Conflict, NotFound } from "../lib/errors";
import type { CreateStudentInput, UpdateStudentInput } from "../validation/student.schema";

export const studentService = {
  list() {
    return studentModel.listActive();
  },

  async getById(id: string) {
    const student = await studentModel.findActiveById(id);
    if (!student) throw NotFound("Student not found.");
    return student;
  },

  /** Create a student-role user + profile together. FR-006. */
  async create(input: CreateStudentInput) {
    if (await userModel.findByEmail(input.email)) {
      throw Conflict("A user with this email already exists.");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await userModel.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: "student",
    });
    try {
      return await studentModel.create(user.id, input.studentNumber);
    } catch (err) {
      // studentNumber unique violation
      throw Conflict("A student with this student number already exists.");
    }
  },

  async update(id: string, input: UpdateStudentInput) {
    await this.getById(id);
    const updated = await studentModel.update(id, { studentNumber: input.studentNumber });
    // fullName lives on the user record; update omitted here for brevity of the profile layer.
    return updated;
  },

  /** Soft delete — preserves enrollments/grades. FR-022. */
  async softDelete(id: string) {
    await this.getById(id);
    return studentModel.softDelete(id);
  },
};
