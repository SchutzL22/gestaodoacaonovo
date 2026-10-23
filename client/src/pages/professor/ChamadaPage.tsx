import React from 'react';
import AttendanceSheet from '../../components/professor/AttendanceSheet';

export default function ChamadaPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AttendanceSheet
        classroomId="c0a80123-0000-0000-0000-000000000002"
        courseTitle="Língua Brasileira de Sinais - Libras Básico"
        classroomCode="LIBRAS-2026.1-NOTURNO"
        minAttendancePct={75}
      />
    </div>
  );
}
