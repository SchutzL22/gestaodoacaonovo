export declare class PasswordHasher {
    private static readonly SALT_ROUNDS;
    static hash(password: string): Promise<string>;
    static compare(password: string, hash: string): Promise<boolean>;
}
