export declare class RefreshTokenUseCase {
    execute(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
