import { LoginInput } from '../../dtos/auth.dto.js';
export declare class LoginUseCase {
    execute(data: LoginInput): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            cpf: string;
            matricula: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
}
