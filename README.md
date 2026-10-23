<div align="center">

# 🤝 Sistema COPER 3.0

**Plataforma Unificada de Gestão de Doações Sociais e Cursos Extracurriculares**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> Plataforma web moderna construída do zero com Clean Architecture, DDD e segurança de nível empresarial para gerenciar doações sociais, emitir horas complementares e administrar cursos extracurriculares como Libras.

[🚀 Instalação Rápida](#-instalação-rápida) • [📐 Arquitetura](#-arquitetura) • [🔐 RBAC](#-matriz-rbac) • [📡 API Reference](#-api-reference) • [🤝 Contribuição](#-contribuição)

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Matriz RBAC](#-matriz-rbac)
- [Árvore de Pastas](#-árvore-de-pastas)
- [Instalação Rápida](#-instalação-rápida)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [API Reference](#-api-reference)
- [Validação Pública de Documentos](#-validação-pública-de-documentos-qr-code)
- [Testes](#-testes)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🌟 Visão Geral

O **Sistema COPER 3.0** é uma plataforma institucional completa que unifica três fluxos críticos:

| Módulo | Descrição |
|---|---|
| 🎁 **Gestão de Doações** | Registro, aprovação e conversão de doações em horas complementares (exclusivo para alunos) |
| 📚 **Cursos Extracurriculares** | Criação de cursos (ex: Libras), turmas, inscrições com fila de espera FIFO automática |
| 📄 **Certificados e Declarações** | Geração de PDFs com QR Code e validação pública via hash único (UUID) |

### ✨ Destaques

- **Fila de espera FIFO transacional** — quando uma vaga abre, o 1º da fila é promovido automaticamente dentro de uma transação Prisma atômica, sem race conditions.
- **Validação pública de documentos** — qualquer pessoa pode validar a autenticidade de um certificado ou declaração via URL pública sem precisar fazer login.
- **Segurança multicamada** — Helmet, CORS estrito, Rate Limiting por IP, JWT com Refresh Token e RBAC granular.
- **Dashboard de Impacto Social** — visão analítica exclusiva para Empresários com gráficos (Recharts) de doações, distribuição por categoria e evolução mensal.
- **Chamada Online Mobile-First** — interface otimizada para professores registrarem presença via smartphone.

---

## 🛠️ Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| **Node.js** | 20 LTS | Runtime |
| **TypeScript** | 5.x | Tipagem estática |
| **Express** | 4.x | Framework HTTP |
| **Prisma ORM** | 5.x | Acesso ao banco de dados |
| **PostgreSQL** | 16 | Banco de dados principal |
| **JWT (jsonwebtoken)** | — | Autenticação stateless |
| **Zod** | 3.x | Validação de schemas de entrada |
| **Helmet** | — | Segurança de cabeçalhos HTTP |
| **express-rate-limit** | — | Proteção contra força bruta |
| **PDFKit + qrcode** | — | Geração de PDFs com QR Code |
| **Nodemailer** | — | Envio de e-mails transacionais |
| **Vitest** | — | Testes unitários |

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| **React** | 18.x | Framework UI |
| **Vite** | 5.x | Bundler e dev server |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.x | Estilização utility-first |
| **Shadcn UI** | — | Componentes acessíveis |
| **Lucide Icons** | — | Ícones |
| **Recharts** | — | Gráficos do Dashboard |
| **React Router DOM** | 6.x | Roteamento SPA |

### Infraestrutura

| Tecnologia | Uso |
|---|---|
| **Docker + Docker Compose** | Ambiente local (PostgreSQL, Redis, PgAdmin) |
| **Redis** | Cache e sessões (preparado) |

---

## 📐 Arquitetura

O backend segue **Clean Architecture** com separação estrita de responsabilidades em 4 camadas:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│          Controllers · Routes · Middlewares · DTOs          │
│                  (Express, Zod Validation)                  │
├─────────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                         │
│               Services · Use Cases · Rules                  │
│      (Lógica de negócio: Fila FIFO, Horas, Emissão PDF)    │
├─────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                            │
│             Entities · Enums · Domain Errors                │
│          (Regras puras, sem dependências externas)          │
├─────────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                        │
│          Prisma Client · Repositories · Email · PDF         │
│             (Adaptadores para serviços externos)            │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de uma Requisição

```
HTTP Request
    │
    ▼
[Rate Limiter] → [Helmet/CORS] → [JWT Middleware] → [RBAC Guard]
    │
    ▼
[Zod Schema Validation]
    │
    ▼
[Controller] → [Service / Use Case] → [Prisma Repository]
    │                                        │
    ▼                                        ▼
[Response DTO]                          [PostgreSQL]
```

---

## 🔐 Matriz RBAC

O sistema implementa **Role-Based Access Control (RBAC)** com 5 perfis distintos:

| Permissão | ALUNO | PROFESSOR | COPER | EMPRESÁRIO | ADMIN (COPER+) |
|---|:---:|:---:|:---:|:---:|:---:|
| Visualizar cursos disponíveis | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inscrever-se em cursos | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancelar própria inscrição | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver próprias horas/certificados | ✅ | ❌ | ❌ | ❌ | ❌ |
| Registrar chamada da turma | ❌ | ✅ | ❌ | ❌ | ✅ |
| Ver turmas que ministra | ❌ | ✅ | ❌ | ❌ | ✅ |
| Registrar/validar doações | ❌ | ❌ | ✅ | ❌ | ✅ |
| Aprovar/rejeitar doações | ❌ | ❌ | ✅ | ❌ | ✅ |
| Criar/editar cursos e turmas | ❌ | ❌ | ✅ | ❌ | ✅ |
| Emitir certificados e declarações | ❌ | ❌ | ✅ | ❌ | ✅ |
| Dashboard de Impacto Social | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ❌ | ✅ |
| Relatórios completos | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Receber horas complementares** | ✅ | ❌ | ❌ | ❌ | ❌ |

> ⚠️ **Regra crítica:** Horas complementares são **exclusivas para o perfil `ALUNO`**. Doações de outros perfis são registradas sem conversão em horas.

---

## 📁 Árvore de Pastas

```
gestaodoacao/
├── 📄 docker-compose.yml          # PostgreSQL 16 + Redis 7 + PgAdmin 4
├── 📄 .env.example                # Template de variáveis de ambiente
├── 📄 README.md
│
├── 📂 backend/
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 vitest.config.ts
│   │
│   ├── 📂 prisma/
│   │   ├── 📄 schema.prisma       # Modelagem completa do banco de dados
│   │   └── 📄 seed.ts             # Seed com dados reais de teste
│   │
│   └── 📂 src/
│       ├── 📂 domain/             # Regras puras de negócio
│       │   ├── enums/             # UserRole, DonationStatus, etc.
│       │   └── errors/            # DomainError, NotFoundError, etc.
│       │
│       ├── 📂 application/        # Casos de uso e serviços
│       │   └── services/
│       │       ├── AuthService.ts
│       │       ├── DonationService.ts
│       │       ├── EnrollmentService.ts  # Fila FIFO transacional
│       │       ├── CertificateService.ts # Emissão + validação pública
│       │       └── AttendanceService.ts
│       │
│       ├── 📂 infrastructure/     # Adaptadores externos
│       │   ├── database/
│       │   │   └── prisma.ts      # Singleton PrismaClient
│       │   ├── pdf/
│       │   │   └── PDFGeneratorService.ts
│       │   └── email/
│       │       └── EmailService.ts
│       │
│       └── 📂 presentation/       # Interface HTTP
│           ├── app.ts             # Express + Helmet + Rate Limit + CORS
│           ├── server.ts
│           ├── controllers/
│           ├── middlewares/
│           └── routes/
│
└── 📂 client/
    ├── 📄 package.json
    ├── 📄 vite.config.ts
    └── 📂 src/
        ├── 📂 components/
        │   └── professor/
        │       └── AttendanceSheet.tsx    # Chamada mobile-first
        ├── 📂 pages/
        │   ├── ValidateCertificatePage.tsx
        │   └── SocialImpactDashboard.tsx
        ├── 📂 context/
        │   └── AuthContext.tsx
        └── 📂 services/
            └── api.ts
```

---

## 🚀 Instalação Rápida

### Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### 1. Clone o Repositório

```bash
git clone https://github.com/sua-org/sistema-coper-3.0.git
cd sistema-coper-3.0
```

### 2. Configure as Variáveis de Ambiente

```bash
cp .env.example backend/.env
# Edite backend/.env com seus valores
```

### 3. Suba a Infraestrutura com Docker

```bash
docker-compose up -d
```

Isso iniciará:
- **PostgreSQL 16** em `localhost:5432`
- **Redis 7** em `localhost:6379`
- **PgAdmin 4** em `http://localhost:8080`

### 4. Instale as Dependências do Backend

```bash
cd backend
npm install
```

### 5. Execute as Migrations e o Seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Inicie o Backend

```bash
npm run dev
# API disponível em: http://localhost:3001
```

### 7. Inicie o Frontend (novo terminal)

```bash
cd ../client
npm install
npm run dev
# App disponível em: http://localhost:5173
```

### 👥 Usuários de Teste

| Papel | E-mail | Senha |
|---|---|---|
| **Admin (COPER)** | admin@coper.edu.br | `Admin@123` |
| **Professor** | prof.ana@coper.edu.br | `Prof@123` |
| **Aluno** | joao.silva@aluno.edu.br | `Aluno@123` |
| **Empresário** | empresa@parceiro.com | `Empresa@123` |

---

## ⚙️ Variáveis de Ambiente

```env
# Servidor
NODE_ENV=development
PORT=3001

# Banco de Dados
DATABASE_URL="postgresql://coper:coper_pass@localhost:5432/coper_db?schema=public"

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outra_chave_secreta_para_refresh_tokens
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# E-mail (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app

# App
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Reference

**Base URL:** `http://localhost:3001/api/v1`

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <access_token>
```

### 🔑 Autenticação (`/auth`)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/auth/register` | Registra novo usuário | Público |
| `POST` | `/auth/login` | Login — retorna `accessToken` + `refreshToken` | Público |
| `POST` | `/auth/refresh` | Renova o `accessToken` via `refreshToken` | Público |
| `POST` | `/auth/logout` | Invalida o refresh token | Autenticado |

**Exemplo — Login:**
```json
// POST /api/v1/auth/login
{ "email": "admin@coper.edu.br", "password": "Admin@123" }

// Response 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "name": "Admin COPER", "role": "COPER" }
}
```

### 🎁 Doações (`/donations`)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/donations` | Registra nova doação | COPER |
| `GET` | `/donations?page=1&limit=10` | Lista doações (paginado) | COPER |
| `GET` | `/donations/:id` | Detalhe de uma doação | COPER |
| `PATCH` | `/donations/:id/approve` | Aprova doação | COPER |
| `PATCH` | `/donations/:id/reject` | Rejeita doação | COPER |
| `GET` | `/donations/my` | Minhas doações | ALUNO |

### 📚 Cursos e Turmas (`/courses`)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/courses` | Cria novo curso | COPER |
| `GET` | `/courses?page=1&limit=10` | Lista cursos (paginado) | Autenticado |
| `GET` | `/courses/:id` | Detalhes com turmas | Autenticado |
| `POST` | `/courses/:id/classrooms` | Cria turma | COPER |
| `GET` | `/classrooms/:id/students` | Lista alunos da turma | PROFESSOR, COPER |

### 🎟️ Inscrições (`/enrollments`)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/enrollments` | Inscreve em turma ou fila de espera | ALUNO |
| `DELETE` | `/enrollments/:id` | Cancela e promove fila automaticamente | ALUNO, COPER |
| `GET` | `/enrollments/my` | Minhas inscrições | ALUNO |

**Lógica de Fila de Espera FIFO:**

```
Aluno solicita inscrição
        │
        ▼
  Vagas disponíveis? ── SIM ──▶ status: ACTIVE
        │
       NÃO
        │
        ▼
  status: WAITLIST (ordenado por createdAt)

Quando ACTIVE cancela:
        │
        ▼
  1º da WAITLIST promovido para ACTIVE (dentro de prisma.$transaction)
```

### ✅ Chamada Online (`/attendance`)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/attendance/:classroomId/session` | Abre sessão de chamada | PROFESSOR, COPER |
| `PATCH` | `/attendance/session/:sessionId/mark` | Marca presença | PROFESSOR, COPER |
| `GET` | `/attendance/:classroomId/sessions` | Histórico de sessões | PROFESSOR, COPER |

### 📄 Certificados (`/certificates`)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/certificates/issue` | Emite certificado/declaração em PDF | COPER |
| `GET` | `/certificates/my?page=1&limit=10` | Meus documentos | ALUNO |
| `GET` | `/certificates/:id/download` | Download do PDF | Autenticado |
| `GET` | `/certificates/validate/:hash` | **Valida por hash** | **🌐 PÚBLICO** |

---

## 🔍 Validação Pública de Documentos (QR Code)

```
1. COPER emite documento → PDFGeneratorService gera o PDF
2. UUID único (authHash) gravado na tabela Document
3. PDF contém QR Code apontando para:
   https://sistema.coper.edu.br/validar?code={authHash}
4. Qualquer pessoa escaneia → página pública sem login
5. Frontend exibe dados verificados do documento
```

**Resposta de documento válido:**
```json
{
  "valid": true,
  "document": {
    "type": "COURSE_CERTIFICATE",
    "holderName": "João da Silva",
    "holderCpf": "123.***.***-**",
    "description": "Curso de Libras — Nível Básico (40h)",
    "issuedAt": "2024-06-15T00:00:00.000Z",
    "issuedBy": "Sistema COPER — Instituição XYZ"
  }
}
```

**Resposta para hash inválido:**
```json
{ "valid": false, "message": "Documento não encontrado ou hash inválido." }
```

---

## 🧪 Testes

```bash
cd backend
npm test              # Roda todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Cobertura de código
```

| Arquivo de Teste | O que testa |
|---|---|
| `EnrollmentService.spec.ts` | Inscrição, rejeição e cancelamento |
| `FIFOEnrollment.spec.ts` | Promoção atômica da fila de espera |
| `DonationService.spec.ts` | Aprovação, rejeição e cálculo de horas |
| `CertificateService.spec.ts` | Emissão e validação pública por hash |

---

## 🤝 Contribuição

1. **Fork** o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commits semânticos: `feat:`, `fix:`, `docs:`, `test:`
4. Execute os testes: `npm test`
5. Abra um **Pull Request**

### Convenções

- TypeScript strict mode — sem `any` implícito
- Zod obrigatório em todos os inputs de rotas
- Respeitar as camadas da Clean Architecture
- Novos endpoints devem ter testes unitários

---

## 📊 Modelo de Dados (ERD Simplificado)

```
User (ALUNO | PROFESSOR | COPER | EMPRESARIO | CIVIL)
 │
 ├──▶ Donation ──▶ DonationItem[]
 │         └──▶ Document (DONATION_DECLARATION + authHash UUID)
 │
 ├──▶ Enrollment ──▶ Classroom ──▶ Course
 │         │              │
 │         │         AttendanceSession ──▶ AttendanceRecord[]
 │         │
 │         └──▶ Document (COURSE_CERTIFICATE + authHash UUID)
 │
 └──▶ [teaches] Classroom (Professor)
```

---

## 📜 Licença

Este projeto está licenciado sob a **MIT License**.

---

<div align="center">

Desenvolvido com ❤️ para o **Sistema COPER 3.0**

*Gestão de Doações Sociais e Cursos Extracurriculares*

</div>
