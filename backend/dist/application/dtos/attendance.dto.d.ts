import { z } from 'zod';
export declare const attendanceItemSchema: z.ZodObject<{
    studentId: z.ZodString;
    isPresent: z.ZodBoolean;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    isPresent: boolean;
    notes?: string | undefined;
}, {
    studentId: string;
    isPresent: boolean;
    notes?: string | undefined;
}>;
export declare const recordAttendanceSchema: z.ZodObject<{
    classroomId: z.ZodString;
    classDate: z.ZodEffects<z.ZodString, Date, string>;
    records: z.ZodArray<z.ZodObject<{
        studentId: z.ZodString;
        isPresent: z.ZodBoolean;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        isPresent: boolean;
        notes?: string | undefined;
    }, {
        studentId: string;
        isPresent: boolean;
        notes?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    classroomId: string;
    classDate: Date;
    records: {
        studentId: string;
        isPresent: boolean;
        notes?: string | undefined;
    }[];
}, {
    classroomId: string;
    classDate: string;
    records: {
        studentId: string;
        isPresent: boolean;
        notes?: string | undefined;
    }[];
}>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
