"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const donationRoutes_js_1 = __importDefault(require("./donationRoutes.js"));
const courseRoutes_js_1 = __importDefault(require("./courseRoutes.js"));
const classroomRoutes_js_1 = __importDefault(require("./classroomRoutes.js"));
const enrollmentRoutes_js_1 = __importDefault(require("./enrollmentRoutes.js"));
const attendanceRoutes_js_1 = __importDefault(require("./attendanceRoutes.js"));
const certificateRoutes_js_1 = __importDefault(require("./certificateRoutes.js"));
const publicRoutes_js_1 = __importDefault(require("./publicRoutes.js"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', authRoutes_js_1.default);
apiRouter.use('/donations', donationRoutes_js_1.default);
apiRouter.use('/courses', courseRoutes_js_1.default);
apiRouter.use('/classrooms', classroomRoutes_js_1.default);
apiRouter.use('/enrollments', enrollmentRoutes_js_1.default);
apiRouter.use('/attendances', attendanceRoutes_js_1.default);
apiRouter.use('/certificates', certificateRoutes_js_1.default);
apiRouter.use('/public', publicRoutes_js_1.default);
const v1Router = (0, express_1.Router)();
v1Router.use('/auth', authRoutes_js_1.default);
v1Router.use('/donations', donationRoutes_js_1.default);
v1Router.use('/courses', courseRoutes_js_1.default);
v1Router.use('/classrooms', classroomRoutes_js_1.default);
v1Router.use('/enrollments', enrollmentRoutes_js_1.default);
v1Router.use('/attendances', attendanceRoutes_js_1.default);
v1Router.use('/certificates', certificateRoutes_js_1.default);
v1Router.use('/public', publicRoutes_js_1.default);
apiRouter.use('/v1', v1Router);
apiRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        version: '3.0.0',
        platform: 'Sistema COPER 3.0',
        timestamp: new Date().toISOString(),
    });
});
exports.default = apiRouter;
