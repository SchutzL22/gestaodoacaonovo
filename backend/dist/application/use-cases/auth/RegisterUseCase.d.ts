import { RegisterInput } from '../../dtos/auth.dto.js';
export declare class RegisterUseCase {
    execute(data: RegisterInput): Promise<{
        user: {
            name: string;
            email: string;
            cpf: string;
            role: import("@prisma/client").$Enums.UserRole;
            id: string;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
}
