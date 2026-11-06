export declare class ValidateCertificateUseCase {
    execute(authHash: string): Promise<{
        isValid: boolean;
        authHash: string;
        documentType: import("@prisma/client").$Enums.DocType;
        documentTypeName: string;
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
            courseTitle: string | undefined;
            classroomCode: string | null | undefined;
            donationSummary: string[] | undefined;
            donationItemsCount: number;
        };
    }>;
}
