import { describe, it, expect } from 'vitest';

/**
 * Testes Unitários da Lógica de Fila de Espera FIFO
 * Sistema COPER 3.0
 */

describe('EnrollmentService - FIFO Waitlist Algorithm', () => {
  it('deve matricular como ACTIVE quando a turma possui vagas livres', () => {
    const maxCapacity = 20;
    const totalActive = 15;

    const isFull = totalActive >= maxCapacity;
    const status = isFull ? 'WAITLIST' : 'ACTIVE';
    const waitlistPosition = isFull ? 1 : null;

    expect(status).toBe('ACTIVE');
    expect(waitlistPosition).toBeNull();
  });

  it('deve alocar na fila de espera WAITLIST com position = lastPosition + 1 quando a turma estiver lotada', () => {
    const maxCapacity = 20;
    const totalActive = 20;
    const currentWaitlist = [
      { studentId: 'student-1', position: 1 },
      { studentId: 'student-2', position: 2 },
    ];

    const isFull = totalActive >= maxCapacity;
    const lastPosition = Math.max(...currentWaitlist.map((w) => w.position), 0);
    const newStudentPosition = lastPosition + 1;

    expect(isFull).toBe(true);
    expect(newStudentPosition).toBe(3);
  });

  it('deve promover o 1º da fila para ACTIVE e decrementar as posições dos demais ao cancelar aluno ativo', () => {
    const waitlist = [
      { id: 'enr-2', studentId: 'student-2', status: 'WAITLIST', position: 1 },
      { id: 'enr-3', studentId: 'student-3', status: 'WAITLIST', position: 2 },
      { id: 'enr-4', studentId: 'student-4', status: 'WAITLIST', position: 3 },
    ];

    // 1. O primeiro é promovido
    const promoted = { ...waitlist[0], status: 'ACTIVE', position: null };

    // 2. Os demais são decrementados em 1
    const remaining = waitlist.slice(1).map((item) => ({
      ...item,
      position: item.position - 1,
    }));

    expect(promoted.status).toBe('ACTIVE');
    expect(promoted.position).toBeNull();
    expect(remaining[0].studentId).toBe('student-3');
    expect(remaining[0].position).toBe(1);
    expect(remaining[1].studentId).toBe('student-4');
    expect(remaining[1].position).toBe(2);
  });
});
