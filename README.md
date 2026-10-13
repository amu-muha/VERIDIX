# VERIDIX 🛡️
> **AI-Powered Gatekeeping & Intelligent Verification Platform**

[![Status: Alpha](https://img.shields.io/badge/status-active%20alpha-yellow.svg)]()
[![Backend](https://img.shields.io/badge/backend-Fastify%205-black.svg)]()
[![Language](https://img.shields.io/badge/language-TypeScript-blue.svg)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%2F%20Prisma-green.svg)]()
[![AI](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-blueviolet.svg)]()

---

## 📖 Overview

**VERIDIX** is an AI-driven gatekeeping platform designed to act as an automated sentinel between users, systems, and sensitive digital operations. By combining real-time LLM inference (Google Gemini) with deterministic validation rules, VERIDIX evaluates incoming payloads, flags malicious attempts or policy violations, and enforces intelligent access control before data ever touches downstream storage or business logic.

---

## 🏗️ System Architecture

### 1. High-Level Layered Architecture

```mermaid
graph TD
    Client["Client Layer (Web Dashboard / Mobile / External APIs)"]

    subgraph Gateway ["Fastify API Gateway"]
        Security["CORS & Security Headers"]
        JWTGuard["JWT Authentication & RBAC Guard"]
        Router["Route Dispatcher (/auth, /topics, /thoughts, /admin)"]
    end

    subgraph GatekeeperCore ["VERIDIX Gatekeeper Engine"]
        Sanitizer["Prompt Sanitization & Boundary Isolation"]
        AIEngine["AI Classifier (Google Gemini 2.5 Flash)"]
        DecisionMatrix{"Decision Matrix"}
    end

    subgraph DataStorage ["Persistence & Analytics"]
        PrismaORM["Prisma Client"]
        Postgres[("PostgreSQL Database")]
        AuditStore[("Audit Logs & Telemetry")]
    end

    Client --> Security
    Security --> JWTGuard
    JWTGuard --> Router
    Router --> Sanitizer
    Sanitizer --> AIEngine
    AIEngine --> DecisionMatrix
    DecisionMatrix -- "SAFE (Approved)" --> PrismaORM
    DecisionMatrix -- "BLOCK (403 Forbidden)" --> Client
    DecisionMatrix --> AuditStore
    PrismaORM --> Postgres
```

### 2. Request Processing Flow (AI Gatekeeper)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Application
    participant Gateway as Fastify Gateway
    participant Guard as JWT / RBAC Guard
    participant AI as Gemini 2.5 Flash
    participant DB as PostgreSQL (Prisma)

    User->>Gateway: POST /thoughts (Bearer Token, content, topicId)
    Gateway->>Guard: Validate JWT Signature
    alt Invalid Token
        Guard-->>User: 401 Unauthorized
    end
    Guard->>AI: Evaluate content for safety and policy compliance
    alt Rate Limit (429)
        AI-->>Gateway: 429 Quota Exceeded
        Gateway-->>User: 429 AI Busy, retry shortly
    else Analysis Success
        AI-->>Gateway: {"status": "SAFE" | "BLOCK", "reason": "..."}
        alt Status == "BLOCK"
            Gateway-->>User: 403 Forbidden (Blocked by AI Gatekeeper)
        else Status == "SAFE"
            Gateway->>DB: prisma.thought.create(...)
            DB-->>Gateway: Saved Record
            Gateway-->>User: 201 Created (Approved Thought)
        end
    end
```

### 3. Database Entity-Relationship (ER) Schema

```mermaid
erDiagram
    User ||--o{ Thought : "authors"
    Topic ||--o{ Thought : "categorizes"
    User ||--o{ AuditLog : "initiates"

    User {
        Int id PK
        String email UK
        String name
        String password
        String role
        String resetToken
        DateTime resetTokenExpiry
    }

    Topic {
        Int id PK
        String title UK
        DateTime createdAt
    }

    Thought {
        Int id PK
        String content
        Int score
        String category
        Boolean flagged
        Int userId FK
        Int topicId FK
        DateTime createdAt
    }

    AuditLog {
        Int id PK
        Int userId FK
        String action
        String inputContent
        String riskLevel
        String decision
        String reason
        DateTime timestamp
    }
```

---

## 💻 Tech Stack

- **Backend:** Node.js (v20+), Fastify 5.x, TypeScript, tsx
- **ORM & Database:** Prisma ORM, PostgreSQL
- **AI & Moderation:** Google Gemini API (`gemini-2.5-flash`), OpenAI fallback
- **Authentication & Security:** `@fastify/jwt`, bcrypt, crypto, Role-Based Access Control (`user`, `admin`)
- **Frontend (Target):** React / Next.js, Tailwind CSS

---

## 📋 Software Requirements Specification (SRS)

### Functional Requirements
- **FR-1: Identity & Access Management (IAM):** Secure registration, bcrypt password hashing (10 salt rounds), JWT token generation, 1-hour crypto password reset tokens, and route-level RBAC (`admin` vs `user`).
- **FR-2: Content Governance:** Administrator-only topic creation, chronological topic queries, and duplicate prevention.
- **FR-3: AI Gatekeeping:** Pre-storage inspection of user payloads for:
  - Safety violations (hate speech, violence, harassment)
  - Security threats (jailbreaks, prompt injection, malicious instructions)
  - Content categorization & automated risk scoring
- **FR-4: Audit & Compliance:** Immutable logging of verification attempts, decisions (`SAFE` vs `BLOCK`), risk scores, and AI reasoning.

### Non-Functional Requirements
- **Latency:** AI gatekeeping P95 latency $< 1500$ ms using Flash LLM endpoints. Non-AI queries $< 50$ ms.
- **Security:** Salted hashing, sanitized inputs, rate limiting (60 req/min per user), and strict CORS headers.
- **Fault Tolerance:** Graceful degradation on API quotas (429) or upstream outages with configurable fail-closed policies.

---

## 🛠️ Project Structure

```bash
VERIDIX/
├── backend/
│   ├── prisma/
│   │   ├── migrations/       # SQL migration history
│   │   ├── schema.prisma     # Database schema definition
│   │   └── seed.ts           # Admin user database seeder
│   ├── src/
│   │   ├── lib/              # External client instances (OpenAI, Gemini)
│   │   ├── plugins/          # Fastify plugins (JWT, auth decorators)
│   │   ├── routes/           # Route controllers (auth, topics, thoughts, admin)
│   │   ├── services/         # Gatekeeper and AI moderation logic
│   │   ├── app.ts            # Fastify application setup & route binding
│   │   ├── db.ts             # Prisma database client
│   │   └── server.ts         # Server bootstrap
│   ├── package.json
│   └── tsconfig.json
├── client/                   # Frontend Web Application (Next.js / Vite)
└── README.md
```

---

## 🚀 API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Public | Register new user account |
| **POST** | `/auth/login` | Public | Authenticate user & issue JWT |
| **POST** | `/auth/forgot-password` | Public | Generate 1-hour password reset token |
| **POST** | `/auth/reset-password` | Public | Set new password with valid token |
| **GET** | `/topics` | Public | List all active topics |
| **POST** | `/topics` | Admin | Create new topic |
| **POST** | `/thoughts` | Authenticated | Submit thought through AI Gatekeeper |
| **GET** | `/admin/topics` | Admin | Manage and list topics with admin telemetry |

---

## 🗺️ Master To-Do Roadmap to Finish VERIDIX

### Phase 1: Backend Architecture & Technical Debt Consolidation
- [x] **Unify Server Entry Points:** Consolidate `src/app.ts` and `src/server.ts` into a single `createApp()` factory with clean lifecycle management.
- [x] **Standardize AI Client Configuration:** Standardize on Gemini 2.5 Flash as primary engine with structured JSON schema outputs (`responseMimeType: "application/json"`).
- [x] **Rate Limiting Middleware:** Add `@fastify/rate-limit` to prevent DDoS and API quota exhaustion.
- [x] **Centralized Error & Response Handler:** Standardize all API JSON error responses (`statusCode`, `error`, `message`, `timestamp`).

### Phase 2: AI Gatekeeper & Security Hardening
- [x] **Anti-Prompt-Injection Layer:** Add prompt delimiter isolation (`<USER_INPUT>...</USER_INPUT>`) and heuristic pre-checks before sending to LLM.
- [x] **Fallback Mechanism:** Implement automatic failover from Gemini to OpenAI `gpt-4o-mini` if Gemini experiences quota or service interruptions, plus deterministic heuristic engine fallback.
- [x] **Configurable Moderation Thresholds:** Support customized risk scoring per topic or application environment.
- [x] **Database Transaction Security:** Wrap thought creation and audit events in Prisma interactive transactions (`$transaction`).

### Phase 3: Audit Logging & Analytics
- [x] **AuditLog Prisma Model:** Create and migrate an `AuditLog` table tracking `userId`, `ipAddress`, `decision`, `riskLevel`, `riskScore`, `reason`, and `timestamp`.
- [x] **Admin Metrics API:** Implement endpoints to query gatekeeper statistics (Total verified, % Blocked, Top violation categories).

### Phase 4: Frontend Development
- [x] **Initialize Frontend Client:** Setup Vite + React in `client/` with Tailwind CSS, Lucide icons, and TypeScript.
- [x] **Authentication Flow:** User signup, login, JWT storage in secure local storage, and password reset screens.
- [x] **Gatekeeper Playground:** Interactive live interface to test prompt verification in real-time with visual risk score badges.
- [x] **Admin Dashboard:** Moderation queue, flagged item review, topic management, and traffic charts/telemetry KPIs.

### Phase 5: Testing & QA
- [x] **Unit Tests:** Test authentication flows, JWT verification, and rule-based heuristics using Vitest.
- [x] **Integration Tests:** Test end-to-end thought submission and AI gatekeeper mocking using Fastify `inject()` and live HTTP verification script.
- [x] **Security Audit:** Scan dependencies and verify zero exposed credentials.

### Phase 6: Deployment & DevOps
- [x] **Dockerization:** Create production `docker-compose.yml` for PostgreSQL container and database persistence.
- [x] **Monorepo Scripts:** Root `package.json` for one-command builds and testing.

---

## 🧪 How to Test VERIDIX (Step-by-Step)

### 1. Database Testing
Verify PostgreSQL is running and seeded:
```bash
# Start PostgreSQL container via Docker Compose
docker compose up -d

# Check database connection
pg_isready -h localhost -p 5435

# Run migrations and seed data
npm run db:migrate
npm run db:seed
```

### 2. Backend Automated Testing
Run the backend test suite powered by Vitest:
```bash
npm run test:backend
```
This tests:
- Heuristic safety rules and prompt injection detection
- Delimiter isolation and empty payload rejection
- User registration, login, and JWT validation
- Topic retrieval and admin authorization guards
- Atomic transactions creating AuditLogs and approved Thoughts

### 3. Frontend Bundle Testing
Verify TypeScript typing and Vite client production bundling:
```bash
npm run build:client
```

### 4. End-to-End System Integration Test
Execute the automated end-to-end verification script:
```bash
./scripts/verify-system.sh
```
This script checks the database, builds backend and frontend, launches a live Fastify server, and sends real HTTP requests testing:
1. Health check (`GET /health`)
2. Admin authentication (`POST /auth/login`)
3. AI Gatekeeper dry-run (`POST /test-ai`)
4. Prompt injection attack blocking (`POST /thoughts` returning 403 Forbidden with audit logging)
5. Admin telemetry metrics (`GET /admin/stats`)

---

## 💻 Getting Started Locally

### 1. Start the Database
```bash
docker compose up -d
```

### 2. Start Backend & Frontend
In Terminal 1 (Backend on port 3000):
```bash
npm run dev:backend
```

In Terminal 2 (Frontend on port 5173):
```bash
npm run dev:client
```

Open your browser at **http://localhost:5173** to access:
- **Verified Thoughts Feed**: Browse topics, post thoughts through the live AI Gatekeeper.
- **AI Playground**: Test arbitrary prompt injection vectors, jailbreaks, and benign queries with real-time risk scores.
- **Admin Telemetry Portal**: Log in as `admin@example.com` / `admin123` to review live KPIs, audit trails, and manage topics.

---

## 👨‍💻 Author

**Aymen Muhammed Seid**  
GitHub: [https://github.com/amu-muha](https://github.com/amu-muha)
