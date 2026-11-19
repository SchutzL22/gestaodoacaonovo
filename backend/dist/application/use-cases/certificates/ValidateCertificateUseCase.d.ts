export declare class ValidateCertificateUseCase {
    execute(authHash: string): Promise<{
        isValid: boolean;
        authHash: string;
        documentType: import("@prisma/client").$Enums.DocType;
        documentTypeName: string;
        isStudent: boolean;
        holderName: string;
        beneficiaryName: string;
        holderCpfMasked: string;
        beneficiaryCpfMasked: string;
        title: string;
        description: string | null;
        hoursEarned: number;
        hoursCompleted: number;
        issuedAt: Date;
        status: string;
        details: {
            metadata: import("@prisma/client/runtime/library").JsonValue;
            matricula: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            courseTitle: string | undefined;
            classroomCode: string | null | undefined;
            instructorName: string | undefined;
            campaignTitle: string | undefined;
            validatedByName: string | undefined;
            donationSummary: string[] | undefined;
            donationItemsCount: number;
            items: {
                description: string;
                category: string;
                quantity: number;
                unit: string | null;
            }[] | undefined;
            isStudent?: undefined;
            donorRole?: undefined;
            receivedByName?: undefined;
        };
    } | {
        isValid: boolean;
        authHash: string;
        documentType: string;
        documentTypeName: string;
        isStudent: boolean;
        holderName: string;
        beneficiaryName: string;
        holderCpfMasked: string;
        beneficiaryCpfMasked: string;
        title: string;
        description: string;
        hoursEarned: number;
        hoursCompleted: number;
        issuedAt: Date;
        status: string;
        details: {
            isStudent: boolean;
            donorRole: import("@prisma/client").$Enums.UserRole;
            matricula: string | null;
            campaignTitle: string | undefined;
            validatedByName: string;
            receivedByName: string;
            donationSummary: string[];
            donationItemsCount: number;
            items: {
                description: string;
                category: string;
                quantity: number;
                unit: string | null;
            }[];
            metadata?: undefined;
            role?: undefined;
            courseTitle?: undefined;
            classroomCode?: undefined;
            instructorName?: undefined;
        };
    }>;
}
