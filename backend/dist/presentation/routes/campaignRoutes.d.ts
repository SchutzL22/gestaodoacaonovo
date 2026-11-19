import { CampaignStatus } from '../../domain/enums/index.js';
declare const router: import("express-serve-static-core").Router;
declare function computeCampaignStatus(startDate?: Date | null, endDate?: Date | null, currentStatus?: CampaignStatus | string | null): CampaignStatus;
export { computeCampaignStatus };
export default router;
