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
}, "strip", z.ZodTypeAny, {
    items: {
        description: string;
        category: string;
        quantity: number;
        unit: string;
    }[];
    evidenceUrl?: string | undefined;
}, {
    items: {
        description: string;
        category: string;
        quantity: number;
        unit?: string | undefined;
    }[];
    evidenceUrl?: string | undefined;
}>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export declare const validateDonationSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
    hoursEarned: z.ZodDefault<z.ZodNumber>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
    hoursEarned: number;
    rejectionReason?: string | undefined;
}, {
    status: "APPROVED" | "REJECTED";
    hoursEarned?: number | undefined;
    rejectionReason?: string | undefined;
}>;
export type ValidateDonationInput = z.infer<typeof validateDonationSchema>;
