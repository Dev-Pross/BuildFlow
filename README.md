# BuildFlow 🔄

> A modern workflow automation platform with visual interface and event-driven execution engine. BuildFlow enables developers to build, deploy, and manage automated workflows connecting various services and APIs.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Development](#development)
- [Microservices](#microservices)
- [Key Features](#key-features)
- [Roadmap](#roadmap)

## 🎯 Overview

BuildFlow is a workflow automation platform inspired by N8N, designed to solve debugging and reliability issues in workflow execution. It provides a visual interface for creating workflows that connect triggers and actions (nodes) to automate business processes.

### Core Concepts

- **Workflows**: Visual representations of automated processes
- **Triggers**: Events that initiate workflow execution
- **Nodes**: Individual actions or operations within a workflow
- **Executions**: Tracked runs of workflows with detailed status and error handling
- **Credentials**: Secure OAuth and API key storage per integration

## 🏗️ Architecture

BuildFlow follows a **microservices architecture** with an **event-driven execution model**:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Web App   │────▶│ HTTP Backend │────▶│  Database   │
│  (Next.js)  │     │  (Express)   │     │ (PostgreSQL)│
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Hooks API  │
                    │  (Express)   │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Processor   │────▶│   Kafka     │
                    │  (KafkaJS)   │     │  (Broker)   │
                    └──────────────┘     └─────────────┘
                            │                    │
                            └────────┬───────────┘
                                     ▼
                            ┌──────────────┐
                            │    Worker    │
                            │  (Consumer)  │
                            └──────────────┘
```

### Execution Flow

1. **Trigger Event**: External event hits Hooks API (`/hooks/catch/:userId/:workflowId`)
2. **Transaction Outbox**: Workflow execution created atomically with outbox entry
3. **Event Publishing**: Processor reads outbox and publishes to Kafka
4. **Execution**: Worker consumes messages and executes workflow nodes
5. **Status Tracking**: Each node execution tracked with retry logic

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.4.5 (App Router, Turbopack)
- **UI Library**: React 19.1.1
- **State Management**: Redux Toolkit 2.11.2 with React Redux
- **Visual Editor**: React Flow (@xyflow/react) 12.9.3
- **Authentication**: NextAuth.js 4.24.13
- **Styling**: TailwindCSS 4.x with PostCSS
- **UI Components**: Radix UI, Lucide React icons
- **Validation**: Zod 3.25.76
- **HTTP Client**: Axios 1.13.2

### Backend Services
- **HTTP Backend**: Express.js 5.1.0 (Port 3002)
- **Hooks Service**: Express.js 5.1.0 (Port 3002)
- **Processor**: KafkaJS 2.2.4 (Producer)
- **Worker**: KafkaJS 2.2.4 (Consumer)

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Prisma Client
- **Migrations**: Prisma Migrate

### Message Queue
- **Broker**: Apache Kafka
- **Client**: KafkaJS 2.2.4
- **Topic**: `First-Client`

### Development Tools
- **Monorepo**: Turborepo 2.5.5
- **Package Manager**: pnpm 10.26.2
- **TypeScript**: 5.7.3 / 5.9.2
- **Linting**: ESLint 9.32.0
- **Formatting**: Prettier 3.6.2

### Integrations
- **Google APIs**: googleapis 166.0.0
- **OAuth**: google-auth-library 10.5.0

### Runtime Requirements
- **Node.js**: >=20
- **Package Manager**: pnpm@10.26.2

## 📁 Project Structure

```
BuildFlow/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/                # App Router pages and routes
│   │   │   ├── api/            # API routes (NextAuth, Google Sheets)
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── workflow/      # Workflow editor page
│   │   │   └── types/          # TypeScript types
│   │   └── store/              # Redux store configuration
│   │
│   ├── http-backend/           # Main Express API server
│   │   └── src/
│   │       ├── routes/         # API route handlers
│   │       │   ├── userRoutes/ # User management
│   │       │   ├── nodes.routes.ts
│   │       │   └── google_callback.ts
│   │       └── index.ts
│   │
│   ├── hooks/                  # Webhook receiver service
│   │   └── src/index.ts        # Receives external triggers
│   │
│   ├── processor/              # Kafka producer service
│   │   └── src/index.ts        # Reads outbox, publishes to Kafka
│   │
│   └── worker/                 # Kafka consumer service
│       └── src/index.ts        # Consumes messages, executes workflows
│
├── packages/
│   ├── db/                     # Prisma database package
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   ├── nodes/                   # Node registry and executors
│   │   └── src/
│   │       ├── google-sheets/  # Google Sheets integration
│   │       ├── common/         # Shared OAuth services
│   │       └── registry/       # Node registration system
│   │
│   ├── common/                 # Shared utilities and schemas
│   │   └── src/index.ts        # Zod schemas, constants
│   │
│   ├── ui/                     # Shared UI component library
│   │   └── src/components/     # Reusable React components
│   │
│   ├── eslint-config/          # Shared ESLint configurations
│   └── typescript-config/      # Shared TypeScript configurations
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── package.json                # Root package.json
```

## 🗄️ Database Schema

### Core Models

#### User Management
- **User**: User accounts with email/password authentication
- **Credential**: OAuth tokens and API keys per integration type

#### Workflow System
- **Workflow**: Main workflow definition with status tracking
- **Trigger**: Workflow trigger configuration (one per workflow)
- **AvailableTrigger**: Registry of available trigger types
- **Node**: Individual action nodes in a workflow
- **AvailableNode**: Registry of available node types

#### Execution Tracking
- **WorkflowExecution**: Tracks entire workflow runs
- **NodeExecution**: Tracks individual node executions with retry logic
- **WorkflowExecutionTable**: Transaction outbox pattern implementation

### Workflow Status Enum
```typescript
enum WorkflowStatus {
  Start        // Initial state
  Pending      // Queued for execution
  InProgress   // Currently executing
  ReConnecting // Retrying connection
  Failed       // Execution failed
  Completed    // Successfully completed
}
```

### Key Relationships
- User → Workflows (1:N)
- Workflow → Trigger (1:1)
- Workflow → Nodes (1:N)
- WorkflowExecution → NodeExecution (1:N)
- Node → Credential (N:1, optional)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >=20
- **pnpm**: 10.26.2
- **PostgreSQL**: Running instance
- **Apache Kafka**: Running broker (default: localhost:9092)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BuildFlow
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env` files in respective directories:
   
   **Root `.env`**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/buildflow"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```
   
   **Kafka Configuration** (for processor/worker):
   ```env
   KAFKA_BROKERS="localhost:9092"
   KAFKA_CLIENT_ID="buildflow-client"
   ```

4. **Set up the database**
   ```bash
   cd packages/db
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. **Start Kafka** (if not already running)
   ```bash
   # Using Docker
   docker run -p 9092:9092 apache/kafka:latest
   ```

### Running the Application

#### Development Mode (All Services)

```bash
# Start all services in development mode
pnpm dev
```

This will start:
- Web app: `http://localhost:3000`
- HTTP Backend: `http://localhost:3002`
- Hooks API: `http://localhost:3002` (same server)
- Processor: Background service
- Worker: Background service

#### Individual Services

```bash
# Web application only
cd apps/web && pnpm dev

# HTTP Backend only
cd apps/http-backend && pnpm dev

# Processor only
cd apps/processor && pnpm dev

# Worker only
cd apps/worker && pnpm dev

# Hooks service only
cd apps/hooks && pnpm dev
```

#### Build for Production

```bash
# Build all packages
pnpm build

# Build specific package
cd apps/web && pnpm build
```

## 💻 Development

### Monorepo Management

BuildFlow uses **Turborepo** for monorepo orchestration and **pnpm workspaces** for dependency management.

#### Available Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

#### Workspace Packages

- `@repo/db` - Database client
- `@repo/nodes` - Node registry and executors
- `@repo/common` - Shared utilities
- `@workspace/ui` - UI component library
- `@workspace/eslint-config` - ESLint configurations
- `@workspace/typescript-config` - TypeScript configurations

### Adding New Nodes

1. Create node definition in `packages/nodes/src/[node-name]/`
2. Implement executor class extending base executor
3. Register node in `NodeRegistry.registerAll()`
4. Node will be automatically available in the UI

Example:
```typescript
// packages/nodes/src/my-node/my-node.node.ts
export class MyNode {
  static async register() {
    await NodeRegistry.register({
      name: "My Node",
      type: "my-node",
      description: "Does something",
      config: {},
      requireAuth: false,
    });
  }
}
```

## 🔧 Microservices

### HTTP Backend (`apps/http-backend`)
- **Port**: 3002
- **Purpose**: Main API server for web app
- **Routes**:
  - `/user/*` - User management, authentication
  - `/node/*` - Node operations
  - `/google/*` - Google OAuth callbacks
- **Features**: CORS enabled, cookie-based auth, Node registry initialization

### Hooks Service (`apps/hooks`)
- **Port**: 3002 (shared with HTTP Backend)
- **Purpose**: Receives external webhook triggers
- **Endpoint**: `POST /hooks/catch/:userId/:workflowId`
- **Pattern**: Transaction Outbox - creates workflow execution atomically

### Processor Service (`apps/processor`)
- **Purpose**: Kafka producer
- **Function**: Polls `WorkflowExecutionTable` (outbox), publishes to Kafka
- **Topic**: `First-Client`
- **Pattern**: Transaction Outbox Pattern implementation

### Worker Service (`apps/worker`)
- **Purpose**: Kafka consumer and workflow executor
- **Function**: Consumes messages, executes workflow nodes sequentially
- **Group ID**: `test-group`
- **Features**: Manual offset commits, error handling

## ✨ Key Features

### 1. Visual Workflow Editor
- Drag-and-drop interface using React Flow
- Real-time workflow visualization
- Node configuration panels
- Trigger and action node types

### 2. Node Registry System
- Dynamic node registration
- Pluggable architecture
- OAuth credential management per node
- Node metadata (name, type, description, auth requirements)

### 3. Event-Driven Execution
- Transaction Outbox Pattern for reliable event publishing
- Kafka-based message queue
- Asynchronous workflow execution
- Guaranteed delivery semantics

### 4. Execution Tracking
- Workflow-level execution tracking
- Node-level execution tracking
- Retry logic with configurable attempts
- Status monitoring (Start, Pending, InProgress, Failed, Completed)
- Input/output data capture
- Error logging and debugging

### 5. Authentication & Security
- NextAuth.js integration
- OAuth 2.0 support (Google)
- Per-node credential storage
- Secure credential management

### 6. Google Sheets Integration
- OAuth-based authentication
- Read/write operations
- Sheet and tab management
- Token refresh handling

## 🗺️ Roadmap

### Completed ✅
- [x] Database schema design
- [x] Microservices architecture
- [x] Event-driven execution system
- [x] Transaction Outbox Pattern
- [x] Node registry system
- [x] Google Sheets integration
- [x] Visual workflow editor (basic)
- [x] User authentication

### In Progress 🚧
- [ ] Enhanced visual workflow editor
- [ ] Real-time execution dashboard
- [ ] Improved error handling and debugging

### Planned 📋
- [ ] Slack integration
- [ ] Webhook triggers
- [ ] Email integration
- [ ] Database integration nodes
- [ ] Conditional logic nodes
- [ ] Workflow templates
- [ ] Team collaboration features
- [ ] Workflow versioning
- [ ] Advanced retry strategies
- [ ] Webhook authentication
- [ ] API rate limiting
- [ ] Workflow scheduling (cron)
- [ ] Workflow testing/debugging tools

## 📝 Technical Highlights

### Transaction Outbox Pattern
Ensures reliable event publishing by storing workflow executions in a database table (`WorkflowExecutionTable`) before publishing to Kafka. The processor service polls this table and publishes events, ensuring no events are lost even if Kafka is temporarily unavailable.

### Node Execution Flow
1. Workflow execution created with status `Start`
2. Nodes executed sequentially based on `position` field
3. Each node execution tracked with:
   - Input/output data (JSON)
   - Execution timestamps
   - Retry count
   - Error messages
4. Status updated through lifecycle: `Start` → `Pending` → `InProgress` → `Completed`/`Failed`

### OAuth Flow
1. User initiates OAuth flow from UI
2. Redirected to Google OAuth consent screen
3. Callback handled at `/google/callback`
4. Tokens stored in `Credential` table with encryption
5. Tokens refreshed automatically when expired

### Workflow Status Lifecycle
```
Start → Pending → InProgress → Completed
                          ↓
                       Failed → ReConnecting → InProgress
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Branch naming conventions
- Pull request process
- Code review requirements
- Issue reporting

## 📄 License

[MIT license]

## 👥 Authors

- [Vamsi , Teja]

---

**Built with ❤️ using Next.js, Express, Kafka, and PostgreSQL**
