export declare class DownloadCertificatePDFUseCase {
    execute(certificateIdOrHash: string, requesterUserId?: string, requesterRole?: string): Promise<{
        pdfBuffer: Buffer<ArrayBufferLike>;
        filename: string;
    }>;
}
