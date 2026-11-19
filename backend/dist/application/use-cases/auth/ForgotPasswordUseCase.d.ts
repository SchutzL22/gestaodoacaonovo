export declare class ForgotPasswordUseCase {
    execute(email: string): Promise<{
        message: string;
    }>;
}
