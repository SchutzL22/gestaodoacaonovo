# 09 — Credenciais, Dados Demo e Hashes de Autenticidade

> **Sistema COPER 3.0 — Faculdade Municipal de Palhoça (FMP)**  
> Projeto Integrador III — Curso de Análise e Desenvolvimento de Sistemas (ADS)  
> Versão do Documento: 3.0 | Atualizado em: Novembro 2026

---

## Sumário

- [Como Executar o Seed Demo](#como-executar-o-seed-demo)
- [Credenciais de Acesso](#credenciais-de-acesso)
- [Hashes de Autenticidade para Validação Pública](#hashes-de-autenticidade-para-validação-pública)
- [Campanhas Configuradas](#campanhas-configuradas)
- [Curso Libras — Turma Lotada e Fila de Espera](#curso-libras--turma-lotada-e-fila-de-espera)
- [Roteiro de Demonstração ao Vivo (Banca)](#roteiro-de-demonstração-ao-vivo-banca)
- [Cenários de Teste por Regra de Negócio](#cenários-de-teste-por-regra-de-negócio)
- [Comandos npm Disponíveis](#comandos-npm-disponíveis)

---

## Como Executar o Seed Demo

```bash
# Opção 1 — script dedicado (alias do seed principal):
npm run seed:demo --prefix backend

# Opção 2 — forma direta:
cd backend && npm run seed

# Opção 3 — reset completo do banco + seed (ambiente dev):
npm run db:reset-demo --prefix backend
```

> [!IMPORTANT]
> O seed é **idempotente**: pode ser executado múltiplas vezes sem duplicar dados.  
> Todos os registros usam `upsert` com chaves fixas (IDs, e-mails e `authHash`).

---

## Credenciais de Acesso

### Perfil COPER / Administrador

| Campo | Valor |
|-------|-------|
| **E-mail** | `coper@fmpsc.edu.br` |
| **Senha** | `Coper@2026` |
| **Papel** | `COPER` (acesso total) |
| **Rota inicial** | `/dashboard` |

### Professores Institucionais

| Nome | E-mail | Senha | Disciplina |
|------|--------|-------|-----------|
| Prof. Rafael Santos | `prof.libras@fmpsc.edu.br` | `Prof@2026` | Libras |
| Profª. Daniela Amorim | `prof.extensao@fmpsc.edu.br` | `Prof@2026` | Empreendedorismo Social |

> Rota inicial dos professores: `/diario-classe`

### Alunos (Matrícula Ativa)

| Nome | E-mail | Senha | Matrícula | Situação |
|------|--------|-------|-----------|----------|
| Lucas Alexandre Vieira Schutz | `lucas.schutz@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241001 | ✅ Ativo |
| Eduardo da Silva | `eduardo.silva@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241002 | ✅ Ativo |
| Davi Aravechia | `davi.aravechia@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241003 | ✅ Ativo |
| Vitor Emanuel | `vitor.emanuel@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241004 | ✅ Ativo |
| Nicolas | `nicolas@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241005 | ✅ Ativo |
| Ana Souza | `ana.souza@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241006 | ✅ Ativo |
| Aluno Inativo (Teste RN05) | `aluno.inativo@aluno.fmpsc.edu.br` | `Aluno@2026` | 20241007 | ❌ **Inativo** |

> [!TIP]
> O aluno `aluno.inativo@aluno.fmpsc.edu.br` tem `isActive: false`.  
> Demonstra o bloqueio da **RN05** (matrícula inativa = sistema bloqueia inscrição em turmas e doações com horas).

### Empresário e Civil

| Perfil | E-mail | Senha | Rota Inicial |
|--------|--------|-------|--------------|
| **Empresário Parceiro** | `parceiro@empresa.com.br` | `Empresa@2026` | `/painel-impacto` |
| **Civil (Comunidade)** | `civil@gmail.com` | `Civil@2026` | `/validar` |

---

## Hashes de Autenticidade para Validação Pública

Acesse em: `http://localhost:5173/validar?code=<hash>`  
Ou via API: `GET http://localhost:3001/api/public/validar/<hash>`

### Doações Aprovadas (com certificado)

| Hash | Doador | Tipo | Horas | Campanha |
|------|--------|------|-------|----------|
| `fmp-d001-lucas-agasalho-2026` | Lucas Schutz (Aluno) | Declaração de Doação | **10h** | Agasalho e Alimentos 2026 (ATIVA) |
| `fmp-d002-eduardo-alimentos-2026` | Eduardo da Silva (Aluno) | Declaração de Doação | **15h** | Agasalho e Alimentos 2026 (ATIVA) |
| `fmp-d003-civil-pascoa-2026` | Maria de Lourdes (Civil) | Comprovante Solidário | 0h | Campanha de Páscoa 2026 (ENCERRADA) |
| `fmp-d004-empresa-responsabilidade-2026` | Empresa Parceira S/A | Comprovante Empresarial | 0h | Agasalho e Alimentos 2026 (ATIVA) |

### Certificados de Curso

| Hash | Aluno | Curso | Carga Horária |
|------|-------|-------|---------------|
| `tok-lucas-libras` | Lucas Alexandre Schutz | Libras Básico — Extensão FMP | **40h** |

### Tokens Curtos para Demo Rápida

| Código | Descrição |
|--------|-----------|
| `tok-civil-001` | Comprovante de doação da Dona Maria — Páscoa 2026 |
| `tok-lucas-libras` | Certificado de conclusão Libras — Lucas Schutz |

---

## Campanhas Configuradas

| ID | Nome | Status | Período | Urgente |
|----|------|--------|---------|---------|
| `c0a80123-...-000000000101` | Campanha do Agasalho e Alimentos FMP 2026 | **ATIVA** | 01/04/2026 → 30/11/2026 | ✅ |
| `c0a80123-...-000000000102` | Campanha de Páscoa FMP 2026 | **ENCERRADA** | 01/03/2026 → 21/04/2026 | ❌ |
| `c0a80123-...-000000000103` | Natal Solidário FMP 2026 | **FUTURA** | 01/12/2026 → 31/12/2026 | ✅ |
| `c0a80123-...-000000000104` | Campanha de Brinquedos e Natal Solidário 2025 | **ENCERRADA** | 01/11/2025 → 25/12/2025 | ❌ |

### Itens Prioritários da Campanha Ativa

| Item | Meta | Urgência |
|------|------|----------|
| Cobertores Térmicos | 100 unidades | 🔴 ALTA |
| Arroz Tipo 1 (5kg) | 200 pacotes | 🔴 ALTA |
| Feijão Preto (1kg) | 150 pacotes | 🔴 ALTA |
| Casacos e Jaquetas Infantis | 80 peças | 🟡 MEDIA |

---

## Curso Libras — Turma Lotada e Fila de Espera

**Curso:** Libras Básico — Extensão FMP (40h, freq. mínima 75%, média mínima 7.0)  
**Turma:** `LIBRAS-2026.1-NOTURNO` — capacidade **4/4** (LOTADA) + 2 na fila

### Estado das Matrículas

| Aluno | Status | Notas A1 / A2 / A3 | Média Final | Frequência | Situação Final |
|-------|--------|---------------------|-------------|------------|----------------|
| Lucas Schutz | ✅ ATIVO | 8.5 / 9.0 / 8.0 | **8.5** | 92% | 🟢 Aprovado |
| Eduardo da Silva | ✅ ATIVO | 7.0 / 7.5 / 8.0 | **7.5** | 85% | 🟢 Aprovado |
| Davi Aravechia | ✅ ATIVO | 9.0 / 8.5 / 9.5 | **9.0** | 95% | 🟢 Aprovado c/ Distinção |
| Ana Souza | ✅ ATIVO | 6.0 / 7.0 / 6.5 | **6.5** | 70% | 🔴 Reprovada (freq. e nota) |
| Vitor Emanuel | ⏳ FILA #1 | — | — | — | Aguardando promoção |
| Nicolas | ⏳ FILA #2 | — | — | — | Aguardando promoção |

> [!TIP]
> **Demo ao vivo:** cancele a matrícula de **Ana Souza** (`ACTIVE → cancelar`) e observe Vitor Emanuel ser promovido automaticamente para a vaga (algoritmo FIFO transacional).

---

## Roteiro de Demonstração ao Vivo (Banca)

### 1. Landing Page Pública
1. Abra `http://localhost:5173` — exibe a landing page institucional dark mode.
2. Observe os cards animados com dados reais (`/api/public/stats`).
3. Role até "Campanhas Ativas" — Campanha do Agasalho com itens urgentes em destaque.

### 2. Login e Dashboard COPER
1. Clique em **"Entrar / Acessar Sistema"** → faça login com `coper@fmpsc.edu.br` / `Coper@2026`.
2. Dashboard exibe gráficos de doações aprovadas, horas geradas e campanhas.
3. Navegue em **Doações Pendentes** — 2 doações aguardam validação (Vitor e anônimo do balcão).

### 3. Validação de Doação e Emissão de PDF
1. Clique em qualquer doação pendente → clique em **"Validar / Aprovar"**.
2. Informe horas complementares (ex: 10h para aluno).
3. Sistema gera PDF automaticamente com QR Code.
4. Baixe o PDF e escaneie o QR Code → redireciona para `/validar?code=...`.

### 4. Validação Pública de Autenticidade
1. Abra `http://localhost:5173/validar` (sem login).
2. Cole o hash `fmp-d001-lucas-agasalho-2026` → exibe comprovante com todos os dados.
3. Demonstre também `tok-lucas-libras` → exibe certificado de conclusão do curso Libras.

### 5. Painel do Aluno
1. Faça logout → login com `lucas.schutz@aluno.fmpsc.edu.br` / `Aluno@2026`.
2. Painel exibe 25h acumuladas, histórico de doações e status no curso Libras.

### 6. Demo da Fila de Espera FIFO
1. Login COPER → vá em **Turmas → LIBRAS-2026.1-NOTURNO**.
2. Cancele a matrícula de **Ana Souza** (reprovada por frequência).
3. Sistema automaticamente promove **Vitor Emanuel** (posição 1 da fila) para `ACTIVE`.
4. Nicolas avança para posição 1 na fila.

### 7. Bloqueio de Aluno Inativo (RN05)
1. Login com `aluno.inativo@aluno.fmpsc.edu.br` / `Aluno@2026`.
2. Tente se inscrever em qualquer turma → sistema bloqueia com mensagem de erro.
3. Tente registrar doação → sistema bloqueia (matrícula inativa).

### 8. Dashboard Empresarial
1. Login com `parceiro@empresa.com.br` / `Empresa@2026`.
2. Painel exibe gráficos ESG de impacto: total doações, horas de extensão, campanhas.

---

## Cenários de Teste por Regra de Negócio

| Regra | Cenário | Como Testar |
|-------|---------|-------------|
| **RN01** — Apenas alunos ganham horas | Aprovar doação do civil `civil@gmail.com` | Horas = 0, sem campo no comprovante |
| **RN02** — Campanha futura bloqueia doação | Tentar doação na campanha "Natal Solidário" | API retorna erro 400 |
| **RN03** — Campanha encerrada bloqueia | Tentar doação na campanha "Páscoa" | API retorna erro 400 |
| **RN04** — Limite semestral de horas | Lucas tem 25h (limite 40h) → tente 20h | Sistema aprova; tente mais 20h → bloqueia |
| **RN05** — Matrícula inativa | Login `aluno.inativo@aluno.fmpsc.edu.br` | Inscrição e doação bloqueadas |
| **RN06** — Turma lotada → fila FIFO | Inscrever Nicolas na turma Libras | Vai para fila pos. 2 |
| **RN07** — Promoção automática | Cancelar matrícula de Ana Souza | Vitor promovido automaticamente |
| **RN08** — Validação de hash | Acessar `/validar?code=tok-civil-001` | Exibe comprovante público |
| **RN10** — Trava máx. 1 ano em relatórios | Período com intervalo > 365 dias ou doações > 1 ano | API bloqueia com HTTP 400 |
| **RN14** — Retenção LGPD (2 anos) | Acionar limpeza manual ou cron 02:00 | Doações expiradas são anonimizadas ou deletadas |
| **RBAC** — Exportação CSV (COPER) | Login com empresário e tentar exportar CSV | Retorna HTTP 403 (acesso restrito a COPER) |

---

## Comandos npm Disponíveis

```bash
# Executar o seed demo (idempotente):
npm run seed --prefix backend
npm run seed:demo --prefix backend

# Reset completo do banco + seed (apaga todos os dados):
npm run db:reset-demo --prefix backend

# Iniciar servidor backend (porta 3001):
npm run dev --prefix backend

# Iniciar frontend (porta 5173):
npm run dev --prefix client

# Executar todos os testes unitários:
npm run test --prefix backend

# Build de produção:
npm run build --prefix backend
```

---

> **Equipe:** Lucas Alexandre Vieira Schutz, Eduardo da Silva, Davi Aravechia, Vitor Emanuel, Nicolas  
> **Orientadora:** Profª. Daniela Amorim  
> **Instituição:** Faculdade Municipal de Palhoça (FMP) — ADS 4ª Fase — Projeto Integrador III
