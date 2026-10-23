import { z } from 'zod';
export declare const createCourseSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    instructorId: z.ZodString;
    workloadHours: z.ZodNumber;
    minAttendancePct: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    instructorId: string;
    workloadHours: number;
    minAttendancePct: number;
}, {
    title: string;
    description: string;
    instructorId: string;
    workloadHours: number;
    minAttendancePct?: number | undefined;
}>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export declare const createClassroomSchema: z.ZodObject<{
    courseId: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    maxCapacity: z.ZodNumber;
    startDate: z.ZodEffects<z.ZodString, Date, string>;
    endDate: z.ZodEffects<z.ZodString, Date, string>;
}, "strip", z.ZodTypeAny, {
    courseId: string;
    maxCapacity: number;
    startDate: Date;
    endDate: Date;
    code?: string | undefined;
}, {
    courseId: string;
    maxCapacity: number;
    startDate: string;
    endDate: string;
    code?: string | undefined;
}>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export declare const enrollClassroomSchema: z.ZodObject<{
    classroomId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    classroomId: string;
}, {
    classroomId: string;
}>;
export type EnrollClassroomInput = z.infer<typeof enrollClassroomSchema>;
