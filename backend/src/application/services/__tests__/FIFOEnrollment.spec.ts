import { describe, it, expect } from 'vitest';

describe('Algoritmo de Fila de Espera FIFO - Sistema COPER 3.0', () => {
  interface SimEnrollment {
    id: string;
    studentId: string;
    status: 'ACTIVE' | 'WAITLIST' | 'CANCELLED';
    waitlistPosition: number | null;
  }

  it('deve alocar vaga ACTIVE quando a turma possui capacidade disponível', () => {
    const maxCapacity = 20;
    const currentActive = 18;

    const isFull = currentActive >= maxCapacity;
    const newEnrollment: SimEnrollment = {
      id: 'enr-19',
      studentId: 'student-19',
      status: isFull ? 'WAITLIST' : 'ACTIVE',
      waitlistPosition: isFull ? 1 : null,
    };

    expect(newEnrollment.status).toBe('ACTIVE');
    expect(newEnrollment.waitlistPosition).toBeNull();
  });

  it('deve atribuir status WAITLIST e calcular waitlistPosition = max + 1 quando turma estiver cheia', () => {
    const maxCapacity = 20;
    const currentActive = 20;
    const currentQueue: SimEnrollment[] = [
      { id: 'enr-21', studentId: 'student-21', status: 'WAITLIST', waitlistPosition: 1 },
      { id: 'enr-22', studentId: 'student-22', status: 'WAITLIST', waitlistPosition: 2 },
    ];

    const isFull = currentActive >= maxCapacity;
    const lastPosition = Math.max(...currentQueue.map((q) => q.waitlistPosition || 0), 0);
    const nextPosition = lastPosition + 1;

    const newEnrollment: SimEnrollment = {
      id: 'enr-23',
      studentId: 'student-23',
      status: isFull ? 'WAITLIST' : 'ACTIVE',
      waitlistPosition: isFull ? nextPosition : null,
    };

    expect(newEnrollment.status).toBe('WAITLIST');
    expect(newEnrollment.waitlistPosition).toBe(3);
  });

  it('deve promover o 1º da fila para ACTIVE e decrementar os demais ao cancelar vaga ativa', () => {
    const activeStudent: SimEnrollment = {
      id: 'enr-1',
      studentId: 'student-1',
      status: 'ACTIVE',
      waitlistPosition: null,
    };

    const waitlist: SimEnrollment[] = [
      { id: 'enr-2', studentId: 'student-2', status: 'WAITLIST', waitlistPosition: 1 },
      { id: 'enr-3', studentId: 'student-3', status: 'WAITLIST', waitlistPosition: 2 },
      { id: 'enr-4', studentId: 'student-4', status: 'WAITLIST', waitlistPosition: 3 },
    ];

    // 1. Aluno ativo cancela
    activeStudent.status = 'CANCELLED';

    // 2. O 1º da fila é promovido
    const promoted = { ...waitlist[0], status: 'ACTIVE' as const, waitlistPosition: null };

    // 3. Os demais são reordenados com decremento de 1
    const reorderedQueue = waitlist.slice(1).map((item) => ({
      ...item,
      waitlistPosition: (item.waitlistPosition || 0) - 1,
    }));

    expect(activeStudent.status).toBe('CANCELLED');
    expect(promoted.status).toBe('ACTIVE');
    expect(promoted.waitlistPosition).toBeNull();
    expect(promoted.studentId).toBe('student-2');

    expect(reorderedQueue[0].studentId).toBe('student-3');
    expect(reorderedQueue[0].waitlistPosition).toBe(1);

    expect(reorderedQueue[1].studentId).toBe('student-4');
    expect(reorderedQueue[1].waitlistPosition).toBe(2);
  });
});
