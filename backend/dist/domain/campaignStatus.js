"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCampaignStatus = computeCampaignStatus;
const index_js_1 = require("./enums/index.js");
const campusCalendar = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});
function compareBoundary(boundary, now) {
    if (boundary.getTime() % 86_400_000 === 0) {
        return boundary.toISOString().slice(0, 10).localeCompare(campusCalendar.format(now));
    }
    return boundary.getTime() - now.getTime();
}
function computeCampaignStatus(startDate, endDate, currentStatus, now = new Date()) {
    if (currentStatus === index_js_1.CampaignStatus.CLOSED || currentStatus === 'Encerrada')
        return index_js_1.CampaignStatus.CLOSED;
    if (startDate && compareBoundary(startDate, now) > 0)
        return index_js_1.CampaignStatus.FUTURE;
    if (endDate && compareBoundary(endDate, now) < 0)
        return index_js_1.CampaignStatus.CLOSED;
    return index_js_1.CampaignStatus.ACTIVE;
}
