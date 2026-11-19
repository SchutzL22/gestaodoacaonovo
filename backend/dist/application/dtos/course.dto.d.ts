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
    startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    endDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    enrollmentStartDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    enrollmentEndDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cancellationDeadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    minGrade: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    courseId: string;
    maxCapacity: number;
    startDate: string | Date;
    endDate: string | Date;
    minGrade: number;
    code?: string | undefined;
    enrollmentStartDate?: string | null | undefined;
    enrollmentEndDate?: string | null | undefined;
    cancellationDeadline?: string | null | undefined;
}, {
    courseId: string;
    maxCapacity: number;
    startDate: string | Date;
    endDate: string | Date;
    code?: string | undefined;
    enrollmentStartDate?: string | null | undefined;
    enrollmentEndDate?: string | null | undefined;
    cancellationDeadline?: string | null | undefined;
    minGrade?: number | undefined;
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
export declare const studentGradeItemSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
    gradeA1: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gradeA2: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gradeA3: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    enrollmentId: string;
    gradeA1?: number | null | undefined;
    gradeA2?: number | null | undefined;
    gradeA3?: number | null | undefined;
}, {
    enrollmentId: string;
    gradeA1?: number | null | undefined;
    gradeA2?: number | null | undefined;
    gradeA3?: number | null | undefined;
}>;
export declare const launchClassroomGradesSchema: z.ZodObject<{
    grades: z.ZodArray<z.ZodObject<{
        enrollmentId: z.ZodString;
        gradeA1: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        gradeA2: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        gradeA3: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        enrollmentId: string;
        gradeA1?: number | null | undefined;
        gradeA2?: number | null | undefined;
        gradeA3?: number | null | undefined;
    }, {
        enrollmentId: string;
        gradeA1?: number | null | undefined;
        gradeA2?: number | null | undefined;
        gradeA3?: number | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    grades: {
        enrollmentId: string;
        gradeA1?: number | null | undefined;
        gradeA2?: number | null | undefined;
        gradeA3?: number | null | undefined;
    }[];
}, {
    grades: {
        enrollmentId: string;
        gradeA1?: number | null | undefined;
        gradeA2?: number | null | undefined;
        gradeA3?: number | null | undefined;
    }[];
}>;
export type LaunchClassroomGradesInput = z.infer<typeof launchClassroomGradesSchema>;
