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
- [ ] **Unify Server Entry Points:** Consolidate `src/app.ts` and `src/server.ts` into a single `createApp()` factory with clean lifecycle management.
- [ ] **Standardize AI Client Configuration:** Standardize on Gemini 2.5 Flash as primary engine with structured JSON schema outputs (`responseMimeType: "application/json"`).
- [ ] **Rate Limiting Middleware:** Add `@fastify/rate-limit` to prevent DDoS and API quota exhaustion.
- [ ] **Centralized Error & Response Handler:** Standardize all API JSON error responses (`statusCode`, `error`, `message`, `timestamp`).

### Phase 2: AI Gatekeeper & Security Hardening
- [ ] **Anti-Prompt-Injection Layer:** Add prompt delimiter isolation (`<USER_INPUT>...</USER_INPUT>`) and heuristic pre-checks before sending to LLM.
- [ ] **Fallback Mechanism:** Implement automatic failover from Gemini to OpenAI `gpt-4o-mini` if Gemini experiences quota or service interruptions.
- [ ] **Configurable Moderation Thresholds:** Support customized risk tolerance levels per topic or application environment.
- [ ] **Database Transaction Security:** Wrap thought creation and audit events in Prisma interactive transactions (`$transaction`).

### Phase 3: Audit Logging & Analytics
- [ ] **AuditLog Prisma Model:** Create and migrate an `AuditLog` table tracking `userId`, `ipAddress`, `decision`, `riskLevel`, `reason`, and `timestamp`.
- [ ] **Admin Metrics API:** Implement endpoints to query gatekeeper statistics (Total verified, % Blocked, Top violation categories).

### Phase 4: Frontend Development
- [ ] **Initialize Frontend Client:** Setup Next.js or Vite + React in `client/` with Tailwind CSS and TypeScript.
- [ ] **Authentication Flow:** User signup, login, JWT storage in secure cookies, and password reset screens.
- [ ] **Gatekeeper Playground:** Interactive live interface to test prompt verification in real-time with visual risk score badges.
- [ ] **Admin Dashboard:** Moderation queue, flagged item review, topic management, and traffic charts.

### Phase 5: Testing & QA
- [ ] **Unit Tests:** Test authentication flows, JWT verification, and rule-based heuristics using Vitest.
- [ ] **Integration Tests:** Test end-to-end thought submission and AI gatekeeper mocking using Supertest / Fastify `inject()`.
- [ ] **Security Audit:** Scan dependencies with `npm audit` and ensure secret-free commits.

### Phase 6: Deployment & DevOps
- [ ] **Dockerization:** Create production multi-stage `Dockerfile` and `docker-compose.yml` for Fastify and PostgreSQL.
- [ ] **CI/CD Pipeline:** Setup GitHub Actions workflow for linting, type-checking, and automated tests.
- [ ] **Cloud Deployment:** Deploy backend to Render/Railway and frontend to Vercel.

---

## 💻 Getting Started Locally

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database
- Google Gemini API key

### 2. Setup Backend
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Create `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/veridix_db?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 4. Run Migrations & Seed Database
```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
```

### 5. Launch Development Server
```bash
npm run dev
```

---

## 👨‍💻 Author

**Aymen Muhammed Seid**  
GitHub: [https://github.com/amu-muha](https://github.com/amu-muha)
