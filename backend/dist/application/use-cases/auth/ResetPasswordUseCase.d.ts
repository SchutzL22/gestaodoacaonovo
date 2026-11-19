export declare class ResetPasswordUseCase {
    execute(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
