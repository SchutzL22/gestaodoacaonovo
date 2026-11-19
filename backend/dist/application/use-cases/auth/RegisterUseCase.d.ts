import { RegisterInput } from '../../dtos/auth.dto.js';
export declare class RegisterUseCase {
    execute(data: RegisterInput): Promise<{
        user: {
            name: string;
            email: string;
            cpf: string;
            role: import("@prisma/client").$Enums.UserRole;
            matricula: string | null;
            address: string | null;
            phone: string | null;
            id: string;
            isActive: boolean;
            semesterHoursLimit: number | null;
            totalHoursEarned: number;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
}
