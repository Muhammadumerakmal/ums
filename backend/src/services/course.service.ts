import { courseModel } from "../models/course.model";
import { teacherModel } from "../models/teacher.model";
import { gradeModel } from "../models/grade.model";
import { Conflict, Forbidden, NotFound, ValidationError } from "../lib/errors";
import type { CreateCourseInput, UpdateCourseInput } from "../validation/course.schema";
import type { CurrentUser } from "../middleware/authenticate";

export const courseService = {
  list() {
    return courseModel.listActive();
  },

  async getById(id: string) {
    const course = await courseModel.findActiveById(id);
    if (!course) throw NotFound("Course not found.");
    return course;
  },

  /** Create a course; reject unknown teacher (FR-008) and duplicate code. */
  async create(input: CreateCourseInput) {
    const teacher = await teacherModel.findById(input.teacherId);
    if (!teacher) throw ValidationError("teacherId does not reference an existing teacher.");
    if (await courseModel.findByCode(input.code)) {
      throw Conflict("A course with this code already exists.");
    }
    return courseModel.create(input);
  },

  async update(id: string, input: UpdateCourseInput) {
    await this.getById(id);
    if (input.teacherId) {
      const teacher = await teacherModel.findById(input.teacherId);
      if (!teacher) throw ValidationError("teacherId does not reference an existing teacher.");
    }
    if (input.code) {
      const existing = await courseModel.findByCode(input.code);
      if (existing && existing.id !== id) throw Conflict("A course with this code already exists.");
    }
    return courseModel.update(id, input);
  },

  async softDelete(id: string) {
    await this.getById(id);
    return courseModel.softDelete(id);
  },

  /**
   * Roster for a course. Admin may view any; a teacher only their own course. FR-015/FR-017.
   */
  async getRoster(courseId: string, actor: CurrentUser, actorTeacherId: string | null) {
    const course = await this.getById(courseId);
    if (actor.role === "teacher" && course.teacherId !== actorTeacherId) {
      throw Forbidden("You can only view rosters for courses you own.");
    }
    return gradeModel.rosterForCourse(courseId);
  },
};
