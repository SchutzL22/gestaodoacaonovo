declare const router: import("express-serve-static-core").Router;
export declare function parsePeriod(startDate: any, endDate: any): {
    parsedStart: Date;
    parsedEnd: Date;
};
export declare function validatePeriod(parsedStart: Date, parsedEnd: Date): void;
export default router;
