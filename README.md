<div align="center">

# 🤝 Sistema COPER 3.0
### Faculdade Municipal de Palhoça (FMP)

**Plataforma Unificada de Gestão de Doações Sociais, Horas Complementares e Cursos Extracurriculares**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> Plataforma web moderna construída com **Clean Architecture**, **Domain-Driven Design (DDD)** e segurança multicamada para gerenciar campanhas solidárias, validação criptográfica de documentos, emissão de horas de extensão e administração de cursos como Libras com fila de espera transacional FIFO.

[🚀 Instalação Rápida](#-instalação-rápida) • [👥 Usuários de Teste](#-usuários-de-teste) • [📄 Modelos de PDF & Validação](#-geração-de-pdfs-e-validação-pública-qr-code) • [🔐 RBAC](#-matriz-rbac-e-perfis) • [📡 API Reference](#-api-reference)

</div>

---

## 📋 Sumário

- [Visão Geral e Novidades](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura e Segurança](#-arquitetura)
- [Matriz RBAC e Perfis](#-matriz-rbac-e-perfis)
- [Modelos de PDF e Validação Pública](#-geração-de-pdfs-e-validação-pública-qr-code)
- [Instalação Rápida](#-instalação-rápida)
- [Usuários de Teste (Credenciais Padrão)](#-usuários-de-teste)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [API Reference](#-api-reference)
- [Testes Automatizados](#-testes-automatizados)
- [Licença](#-licença)

---

## 🌟 Visão Geral

O **Sistema COPER 3.0** foi concebido para digitalizar e integrar os projetos de extensão comunitária da Faculdade Municipal de Palhoça:

| Módulo | Descrição |
|---|---|
| 🌐 **Landing Page Institucional Dark Mode** | Rota pública `/` com dados dinâmicos de impacto (`/api/public/stats`), vitrine de campanhas e cursos, e formulário interativo para **Doação de Civil sem login**. |
| 🎁 **Gestão de Doações Sociais** | Registro por campanhas ativas, controle de itens prioritários, fila de validação e concessão auditável de horas complementares (exclusivo para alunos). |
| 📚 **Cursos Extracurriculares (Libras)** | Gestão de turmas com janelas de inscrição, diário de classe digital com lançamento de notas (A1, A2 e A3), chamada online e **algoritmo de fila de espera transacional FIFO**. |
| 📄 **Validação Pública Criptográfica** | Comprovantes e diplomas emitidos em PDF com logo oficial FMP, código hash UUID único e **QR Code apontando para `${FRONTEND_URL}/validar?code=${hash}`** (modelo Unisul). |
| 🔍 **Busca Global Debounced** | Campo de busca rápido no topbar pesquisando simultaneamente alunos (nome/matrícula), campanhas e doações. |

---

## 🛠️ Stack Tecnológica

### Backend
- **Node.js 20 LTS** & **TypeScript 5**
- **Express.js** estruturado em Clean Architecture
- **Prisma ORM** & **PostgreSQL 16**
- **Zod** para validação estrita de esquemas em tempo de execução
- **Helmet**, **CORS**, **express-rate-limit** e **BCrypt**
- **JWT (JSON Web Token)** com Access Token e Refresh Token
- **PDFKit** + **qrcode** para geração de PDFs com assinatura digital visual
- **Vitest** com 100% dos testes unitários de regras de negócio aprovados

### Frontend
- **React 18** com **Vite**
- **Tailwind CSS** + paleta Dark Mode institucional (azul marinho profundo, roxo, preto e neon ciano/esmeralda)
- **Lucide Icons** & **Recharts** para visualização analítica de dados
- **React Router DOM 6** com redirecionamento RBAC inteligente por perfil
- **React Hot Toast** para notificações contextuais

---

## 🔐 Matriz RBAC e Perfis

O sistema possui controle de acesso rigoroso baseado em 5 perfis:

| Permissão / Recurso | `ALUNO` | `PROFESSOR` | `COPER` (Admin) | `EMPRESÁRIO` | `CIVIL` |
|---|:---:|:---:|:---:|:---:|:---:|
| Redirecionamento Inicial | `/meu-painel` | `/diario-classe` | `/dashboard` | `/painel-impacto` | `/validar` |
| Domínio de E-mail Obrigatório | `@aluno.fmpsc.edu.br` | `@fmpsc.edu.br` | `@fmpsc.edu.br` ou `@coper.edu.br` | Livre | Livre |
| **Conversão de Doações em Horas** | ✅ | ❌ | ❌ | ❌ | ❌ |
| Matrícula Acadêmica Obrigatória | ✅ | ❌ | ❌ | ❌ | ❌ |
| Inscrição em Cursos Extracurriculares | ✅ | ❌ | ❌ | ❌ | ❌ |
| Promoção Automática Fila FIFO | ✅ | ❌ | ❌ | ❌ | ❌ |
| Diário de Classe (Chamada + A1/A2/A3) | ❌ | ✅ | ✅ | ❌ | ❌ |
| Homologar / Validar Doações | ❌ | ❌ | ✅ | ❌ | ❌ |
| Gestão de Turmas e Campanhas | ❌ | ❌ | ✅ | ❌ | ❌ |
| Painel Executivo ESG e Gráficos | ❌ | ❌ | ✅ | ✅ | ❌ |
| Doação Solidária sem Login | ❌ | ❌ | ❌ | ❌ | ✅ |

> ⚠️ **Regra Fundamental de Extensão:** Apenas estudantes do perfil `ALUNO` acumulam horas complementares. Doações realizadas por Professores ou Cidadãos são registradas como contribuições solidárias, gerando Comprovante Modelo 2 (sem horas).

---

## 📄 Geração de PDFs e Validação Pública (QR Code)

O serviço `PDFGeneratorService` emite 3 modelos oficiais de documento em PDF com alta resolução e elementos gráficos:

1. **Modelo 1 — Comprovante de Doação para ALUNO:**
   - Nome, matrícula acadêmica, e-mail institucional e CPF mascarado.
   - Lista discriminada de itens e quantidades doadas.
   - **Horas complementares concedidas** com destaque visual.
   - Nome e matrícula/cargo de quem homologou a doação.
   - Hash UUID único e QR Code apontando para validação pública.

2. **Modelo 2 — Comprovante de Doação para CIVIL / PROFESSOR:**
   - Nome do doador, CPF mascarado e campanha apoiada.
   - Discriminação de itens e data de homologação.
   - **Isento de qualquer menção a horas acadêmicas**.
   - Hash UUID e QR Code para comprovação de ação solidária.

3. **Modelo 3 — Certificado Oficial de Conclusão de Curso (Diploma):**
   - Nome do estudante e matrícula.
   - Nome do curso (ex: Libras Básico), carga horária total e período de realização.
   - Professor instrutor responsável.
   - Média final calculada (A1, A2 e A3) e percentual de frequência presencial.
   - Hash verificador e QR Code com validade jurídica institucional.

### Validação Pública Estilo Unisul
- URL: `https://<dominio>/validar?code=<hash>`
- Endpoint da API: `GET /api/public/validar/:code`
- Códigos pré-configurados para testes rápidos:
  - `tok-luc-001` — Doação de Aluno FMP (Modelo 1)
  - `tok-edu-001` — Doação Solidária de Professor (Modelo 2)

---

## 🚀 Instalação Rápida

### 1. Clonar o Repositório
```bash
git clone https://github.com/lucasschutz/gestaodoacaonovo.git
cd gestaodoacaonovo
```

### 2. Configurar o Backend
```bash
cd backend
npm install
```

Copie as variáveis de ambiente:
```bash
cp .env.example .env
```

Execute as migrações e o seed de dados:
```bash
npx prisma migrate dev --name init
npm run seed
```

Inicie o servidor backend (Porta 3001):
```bash
npm run dev
```

### 3. Configurar o Frontend
Em outro terminal:
```bash
cd client
npm install
npm run dev
```
Acesse a aplicação em: `http://localhost:5173`

---

## 👥 Usuários de Teste

O seed oficial cria os usuários abaixo prontos para autenticação:

| Perfil | E-mail de Teste | Senha | Destino Pós-Login |
|---|---|---|---|
| **Admin / COPER** | `coper@coper.edu.br` *(ou `admin@fmpsc.edu.br`)* | `admin123` | `/dashboard` |
| **Professor** | `professor.libras@coper.edu.br` | `prof123` | `/diario-classe` |
| **Professor TI** | `professor.ti@coper.edu.br` | `prof123` | `/diario-classe` |
| **Aluno** | `lucas@aluno.fmpsc.edu.br` *(ou `lucas.aluno@aluno.coper.edu.br`)* | `aluno123` | `/meu-painel` |
| **Aluna** | `mariana.aluna@aluno.coper.edu.br` | `aluno123` | `/meu-painel` |
| **Empresário** | `contato@techparceira.com.br` | `empresa123` | `/painel-impacto` |
| **Civil (Comunidade)** | `comunidade.palhoca@gmail.com` | `civil123` | `/validar` |

---

## ⚙️ Variáveis de Ambiente

Arquivo `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coper_db?schema=public"

# Segurança JWT
JWT_SECRET=coper_super_secret_jwt_key_2026_fmp_palhoca
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=coper_refresh_token_secret_key_2026_fmp
JWT_REFRESH_EXPIRES_IN=7d

# URLs da Aplicação
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:3001
```

---

## 📡 API Reference

Base URL: `http://localhost:3001/api`

### Rotas Públicas (Sem Autenticação)
- `GET /public/stats` — Métricas consolidadas de impacto, campanhas ativas e cursos.
- `GET /public/validar/:code` — Validação de hash criptográfico ou token alias.
- `POST /public/doacoes/anonima` — Registro de doação civil/comunitária sem login.
- `POST /auth/register` — Cadastro com validação de domínio institucional por perfil.
- `POST /auth/login` — Autenticação e emissão de tokens JWT.

### Rotas de Doações (`/donations`)
- `GET /donations/my` — Histórico de doações do usuário logado.
- `POST /donations` — Envio de nova doação (aluno ou doador identificado).
- `PATCH /donations/:id/validate` — Homologação da doação pela COPER (concessão de horas ou justificativa de recusa).

### Rotas de Cursos e Turmas (`/classrooms` & `/courses`)
- `POST /courses` — Cadastro de cursos e cargas horárias (Perfil COPER).
- `POST /classrooms/:id/enroll` — Inscrição de aluno com promoção e fila FIFO.
- `DELETE /enrollments/:id` — Desistência com promoção automática atômica da fila.
- `POST /classrooms/:id/attendance` — Lançamento de chamada digital da aula pelo professor.
- `POST /classrooms/:id/grades` — Lançamento das notas A1, A2 e A3.
- `POST /classrooms/:id/close` — Encerramento da turma e emissão em lote dos certificados Modelo 3.

### Rota de Busca Global (`/search`)
- `GET /search?q=:termo` — Busca rápida e debounced em alunos, campanhas e doações.

---

## 🧪 Testes Automatizados

O backend conta com suíte de testes unitários com **Vitest**:

```bash
cd backend
npm run test
```

**Cobertura de Testes:**
- Regras de domínio e travas de segurança COPER 3.0.
- Algoritmo transacional de fila de espera FIFO (`FIFOEnrollment.spec.ts`).
- Emissão e assinatura binária dos 3 modelos de PDF (`PDFAndNotificationSystem.spec.ts`).
- Validação pública de autenticidade (`DocumentValidation.spec.ts`).

---

## 📜 Licença

Desenvolvido para o **Sistema COPER 3.0** — Faculdade Municipal de Palhoça (FMP).  
Distribuído sob a licença [MIT](LICENSE).
