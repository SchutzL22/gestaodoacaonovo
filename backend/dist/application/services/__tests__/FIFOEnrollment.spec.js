"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Algoritmo de Fila de Espera FIFO - Sistema COPER 3.0', () => {
    (0, vitest_1.it)('deve alocar vaga ACTIVE quando a turma possui capacidade disponível', () => {
        const maxCapacity = 20;
        const currentActive = 18;
        const isFull = currentActive >= maxCapacity;
        const newEnrollment = {
            id: 'enr-19',
            studentId: 'student-19',
            status: isFull ? 'WAITLIST' : 'ACTIVE',
            waitlistPosition: isFull ? 1 : null,
        };
        (0, vitest_1.expect)(newEnrollment.status).toBe('ACTIVE');
        (0, vitest_1.expect)(newEnrollment.waitlistPosition).toBeNull();
    });
    (0, vitest_1.it)('deve atribuir status WAITLIST e calcular waitlistPosition = max + 1 quando turma estiver cheia', () => {
        const maxCapacity = 20;
        const currentActive = 20;
        const currentQueue = [
            { id: 'enr-21', studentId: 'student-21', status: 'WAITLIST', waitlistPosition: 1 },
            { id: 'enr-22', studentId: 'student-22', status: 'WAITLIST', waitlistPosition: 2 },
        ];
        const isFull = currentActive >= maxCapacity;
        const lastPosition = Math.max(...currentQueue.map((q) => q.waitlistPosition || 0), 0);
        const nextPosition = lastPosition + 1;
        const newEnrollment = {
            id: 'enr-23',
            studentId: 'student-23',
            status: isFull ? 'WAITLIST' : 'ACTIVE',
            waitlistPosition: isFull ? nextPosition : null,
        };
        (0, vitest_1.expect)(newEnrollment.status).toBe('WAITLIST');
        (0, vitest_1.expect)(newEnrollment.waitlistPosition).toBe(3);
    });
    (0, vitest_1.it)('deve promover o 1º da fila para ACTIVE e decrementar os demais ao cancelar vaga ativa', () => {
        const activeStudent = {
            id: 'enr-1',
            studentId: 'student-1',
            status: 'ACTIVE',
            waitlistPosition: null,
        };
        const waitlist = [
            { id: 'enr-2', studentId: 'student-2', status: 'WAITLIST', waitlistPosition: 1 },
            { id: 'enr-3', studentId: 'student-3', status: 'WAITLIST', waitlistPosition: 2 },
            { id: 'enr-4', studentId: 'student-4', status: 'WAITLIST', waitlistPosition: 3 },
        ];
        activeStudent.status = 'CANCELLED';
        const promoted = { ...waitlist[0], status: 'ACTIVE', waitlistPosition: null };
        const reorderedQueue = waitlist.slice(1).map((item) => ({
            ...item,
            waitlistPosition: (item.waitlistPosition || 0) - 1,
        }));
        (0, vitest_1.expect)(activeStudent.status).toBe('CANCELLED');
        (0, vitest_1.expect)(promoted.status).toBe('ACTIVE');
        (0, vitest_1.expect)(promoted.waitlistPosition).toBeNull();
        (0, vitest_1.expect)(promoted.studentId).toBe('student-2');
        (0, vitest_1.expect)(reorderedQueue[0].studentId).toBe('student-3');
        (0, vitest_1.expect)(reorderedQueue[0].waitlistPosition).toBe(1);
        (0, vitest_1.expect)(reorderedQueue[1].studentId).toBe('student-4');
        (0, vitest_1.expect)(reorderedQueue[1].waitlistPosition).toBe(2);
    });
});
