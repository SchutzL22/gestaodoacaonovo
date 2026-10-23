export declare class ValidateCertificateUseCase {
    execute(authHash: string): Promise<{
        isValid: boolean;
        authHash: string;
        documentType: import("@prisma/client").$Enums.DocType;
        documentTypeName: string;
        holderName: string;
        holderCpfMasked: string;
        title: string;
        description: string | null;
        hoursEarned: number;
        issuedAt: Date;
        status: string;
        details: {
            metadata: import("@prisma/client/runtime/library").JsonValue;
            courseTitle: string | undefined;
            donationSummary: string[] | undefined;
        };
    }>;
}
