import { z } from 'zod';
export declare const donationItemSchema: z.ZodObject<{
    description: z.ZodString;
    category: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: string;
    quantity: number;
    unit: string;
}, {
    description: string;
    category: string;
    quantity: number;
    unit?: string | undefined;
}>;
export declare const createDonationSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        category: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        category: string;
        quantity: number;
        unit: string;
    }, {
        description: string;
        category: string;
        quantity: number;
        unit?: string | undefined;
    }>, "many">;
    evidenceUrl: z.ZodOptional<z.ZodString>;
    campaignId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    receivedById: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    donorName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    donorCpf: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    observation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    items: {
        description: string;
        category: string;
        quantity: number;
        unit: string;
    }[];
    donorName?: string | null | undefined;
    donorCpf?: string | null | undefined;
    evidenceUrl?: string | undefined;
    campaignId?: string | null | undefined;
    receivedById?: string | null | undefined;
    observation?: string | null | undefined;
}, {
    items: {
        description: string;
        category: string;
        quantity: number;
        unit?: string | undefined;
    }[];
    donorName?: string | null | undefined;
    donorCpf?: string | null | undefined;
    evidenceUrl?: string | undefined;
    campaignId?: string | null | undefined;
    receivedById?: string | null | undefined;
    observation?: string | null | undefined;
}>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export declare const validateDonationSchema: z.ZodEffects<z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
    hoursEarned: z.ZodDefault<z.ZodNumber>;
    rejectionReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    observation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
    hoursEarned: number;
    observation?: string | null | undefined;
    rejectionReason?: string | null | undefined;
}, {
    status: "APPROVED" | "REJECTED";
    observation?: string | null | undefined;
    hoursEarned?: number | undefined;
    rejectionReason?: string | null | undefined;
}>, {
    status: "APPROVED" | "REJECTED";
    hoursEarned: number;
    observation?: string | null | undefined;
    rejectionReason?: string | null | undefined;
}, {
    status: "APPROVED" | "REJECTED";
    observation?: string | null | undefined;
    hoursEarned?: number | undefined;
    rejectionReason?: string | null | undefined;
}>;
export type ValidateDonationInput = z.infer<typeof validateDonationSchema>;
export declare const reportFilterSchema: z.ZodObject<{
    campaignId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodString>]>;
    endDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodString>]>;
    status: z.ZodDefault<z.ZodEnum<["ALL", "PENDING", "APPROVED", "REJECTED"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED" | "ALL" | "PENDING";
    page: number;
    limit: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
    campaignId?: string | undefined;
}, {
    status?: "APPROVED" | "REJECTED" | "ALL" | "PENDING" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    campaignId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
