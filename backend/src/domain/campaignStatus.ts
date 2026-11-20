import { CampaignStatus } from './enums/index.js';

const campusCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

// O formulário grava datas sem horário como meia-noite UTC no PostgreSQL.
function compareBoundary(boundary: Date, now: Date): number {
  if (boundary.getTime() % 86_400_000 === 0) {
    return boundary.toISOString().slice(0, 10).localeCompare(campusCalendar.format(now));
  }
  return boundary.getTime() - now.getTime();
}

export function computeCampaignStatus(startDate?: Date | null, endDate?: Date | null,
  currentStatus?: string | null, now = new Date()): CampaignStatus {
  if (currentStatus === CampaignStatus.CLOSED || currentStatus === 'Encerrada') return CampaignStatus.CLOSED;
  if (startDate && compareBoundary(startDate, now) > 0) return CampaignStatus.FUTURE;
  if (endDate && compareBoundary(endDate, now) < 0) return CampaignStatus.CLOSED;
  return CampaignStatus.ACTIVE;
}
