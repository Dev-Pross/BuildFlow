# BuildFlow

> An open-source workflow automation and integration platform featuring an intuitive visual canvas and an event-driven distributed execution engine.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.4-black.svg)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.1-lightgrey.svg)](https://expressjs.com/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-Distributed%20Events-red.svg)](https://kafka.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue.svg)](https://supabase.com/)

<img width="1024" height="559" alt="BuildFlow Canvas" src="https://github.com/user-attachments/assets/2a8de777-7202-4611-9d9b-887bf93bfec3" />

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [System Flows](#system-flows)
   - [User Flow](#user-flow)
   - [Data Flow](#data-flow)
4. [Node User Manual](#node-user-manual)
   - [Node Reference Table](#node-reference-table)
   - [Webhook Trigger](#webhook-trigger)
   - [Google Sheets Node](#google-sheets-node)
   - [Gmail Node](#gmail-node)
   - [HTTP Request Node](#http-request-node)
   - [If / Else Node](#if--else-node)
   - [Data Filter Node](#data-filter-node)
   - [Iterator Node](#iterator-node)
5. [Standard Workflow Templates](#standard-workflow-templates)
6. [Variable Interpolation](#variable-interpolation)
7. [Branch Routing and Status Lifecycle](#branch-routing-and-status-lifecycle)
8. [System Architecture](#system-architecture)
9. [Technology Stack](#technology-stack)
10. [Project Structure](#project-structure)
11. [Environment Configuration](#environment-configuration)
12. [Getting Started](#getting-started)
13. [Integrations and Authentication](#integrations-and-authentication)
14. [Deployment Guidelines](#deployment-guidelines)
15. [Troubleshooting](#troubleshooting)
16. [Authors and License](#authors-and-license)

---

## Overview

BuildFlow is an open-source workflow automation platform that enables users to connect cloud applications, automate business processes, and orchestrate API integrations through a visual interface. 

Workflows are designed visually on an interactive canvas and executed asynchronously by a distributed, message-driven backend.

### Key Capabilities
- **Visual Canvas:** Graph-based editor powered by React Flow for designing automation pipelines.
- **Reliable Asynchronous Execution:** Built upon the Transaction Outbox Pattern and message queue infrastructure to ensure guaranteed delivery.
- **Live Execution Feedback:** Real-time visual telemetry showing execution progress and node status updates.
- **Self-Hostable:** Full control over infrastructure, data privacy, and resource allocation with zero artificial execution restrictions.

---

## Problem Statement

Modern integration and workflow platforms present several operational challenges for growing teams:

1. **Escalating Usage Costs:** Proprietary SaaS platforms charge steep per-step fees. High-frequency workflows or periodic batch jobs quickly result in unpredictable billing or account throttling.
2. **Limited Execution Transparency:** Debugging failed workflow runs in conventional platforms is often difficult due to restricted access to raw request and response payloads.
3. **Data Privacy and Sovereignty:** Sending sensitive customer information, credentials, and internal database records through third-party multi-tenant servers presents regulatory and compliance concerns.
4. **Reliability Under Volume:** Direct synchronous webhook execution often leads to dropped requests during traffic spikes or target service downtime.
5. **Gated Transformation Primitives:** Essential data operations—such as list iteration, deduplication, and conditional branching—are frequently locked behind premium enterprise tiers.

BuildFlow addresses these issues by providing a transparent, self-hosted automation engine with guaranteed message delivery, comprehensive execution logs, and unrestricted transformation primitives.

---

## System Flows

### User Flow

The platform provides a streamlined workflow creation lifecycle:

```
[ Authentication ] -> [ Connect Accounts ] -> [ Design Workflow ]
                                                     |
                                                     v
[ Monitor Executions ] <- [ Activate Workflow ] <- [ Test & Validate ]
```

1. **Authentication:** The user logs into the management portal.
2. **Credential Configuration:** Secure connections are established for third-party integrations (e.g., Google Workspace) within the credentials vault.
3. **Workflow Assembly:** Using the visual canvas, the user places a trigger and links action nodes, defining data paths and transformation rules.
4. **Testing and Validation:** The user tests individual nodes or triggers sample events to verify data mapping with live visual feedback.
5. **Activation:** The workflow is deployed to production to receive live triggers.
6. **Execution Monitoring:** Detailed logs provide visibility into input/output payloads, run durations, and operational statuses.

---

### Data Flow

Events move through a decoupled, fault-tolerant processing pipeline:

```
[ Inbound Event ] -> [ Ingestion Service ] -> [ Database Outbox ]
                                                     |
                                                     v
[ Telemetry Stream ] <- [ Worker Engine ] <- [ Event Queue ]
```

1. **Ingestion:** An external system sends an HTTP payload to a designated webhook endpoint.
2. **Persistence:** The ingestion service atomically records the execution request and an outbox entry in the database, immediately acknowledging the sender.
3. **Queue Publishing:** A background process polls pending outbox records and publishes event tasks to the central message broker.
4. **Distributed Execution:** Worker instances consume tasks, retrieve workflow graphs, resolve dynamic variables, and execute node operations sequentially or along conditional branches.
5. **Telemetry Stream:** Node status transitions (Started, Completed, Skipped, or Failed) are published back to the application layer and streamed live to the client interface.

---

## Node User Manual

This manual details every available trigger and action node within BuildFlow, explaining operations, parameter handling (with parameters vs. without parameters), predicted output schemas, and downstream variable mapping.

### Node Reference Table

| Node Name | Type Identifier | Node Category | Authentication | Primary Purpose | Output Handles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Webhook** | `webhook` | Trigger | None | Initiates workflows upon receiving incoming HTTP requests. | Single Output (`out-0`) |
| **Google Sheets** | `google_sheet` | Action | Google OAuth 2.0 | Reads, appends, updates, or clears spreadsheet rows. | Single Output (`out-0`) |
| **Gmail** | `gmail` | Action | Google OAuth 2.0 | Dispatches automated transactional or notification emails. | Dual Output (`out-0`: Success, `out-1`: Failed) |
| **HTTP Request** | `http_request` | Action | Optional Header Auth | Communicates with any external REST API endpoint. | Single Output (`out-0`) |
| **If / Else** | `if_else` | Logic | None | Routes execution paths based on evaluated comparison rules. | Dual Output (`out-0`: True, `out-1`: False) |
| **Data Filter** | `filter` | Transform | None | Deduplicates, filters, or groups data collections. | Dual Output (`out-0`: Filtered, `out-1`: Excluded) |
| **Iterator** | `iterator` | Transform | None | Unpacks an array into individual items for batch processing. | Single Output (`out-0`: Item Stream) |

---

### Webhook Trigger

#### Purpose
Acts as the entry point for event-driven workflows, executing downstream nodes upon receiving incoming HTTP calls.

#### Authentication
Public endpoint protected by a unique endpoint token generated per workflow.

#### Parameter Behavior (With vs. Without Parameters)
- **`body` (HTTP Request Body):**
  - *With Body:* Parses JSON payload and exposes all properties under `{{webhook.body.<key>}}`.
  - *Without Body (Empty POST):* Initializes `body` as an empty object `{}`. Downstream variable lookups for `{{webhook.body.<key>}}` resolve safely to `undefined`.
- **`query` (URL Query Parameters):**
  - *With Query Parameters (e.g. `?source=facebook&campaign=summer`):* Parses and exposes keys under `{{webhook.query.source}}`.
  - *Without Query Parameters:* Sets `query` to `{}`.
- **`headers` (HTTP Headers):**
  - Automatically captures incoming request headers under `{{webhook.headers.<header-name>}}`.

#### Concrete Input Example
Incoming HTTP POST request to the generated webhook endpoint:
```http
POST /hooks/catch/...
Content-Type: application/json

{
  "event": "lead.created",
  "customer": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "score": 85
}
```

#### Predicted Output Structure
```json
{
  "body": {
    "event": "lead.created",
    "customer": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "score": 85
  },
  "headers": {
    "content-type": "application/json",
    "user-agent": "FormCapture/2.0"
  },
  "query": {},
  "method": "POST",
  "receivedAt": "2026-10-18T12:00:00.000Z"
}
```

#### Downstream Usage
- `{{webhook.body.customer.name}}` -> `"Jane Doe"`
- `{{webhook.body.score}}` -> `85`

---

### Google Sheets Node

#### Purpose
Automates reading, appending, writing, and clearing rows in Google Spreadsheets.

#### Authentication
Requires an authorized Google OAuth connection (`gsheet_oauth`).

#### Operations and Parameter Behavior (With vs. Without Parameters)

#### 1. `read_rows`
- **`spreadsheetId` (Required):** The alphanumeric identifier extracted from the sheet URL (`/spreadsheets/d/<ID>/edit`). *Without parameter:* Operation fails immediately with validation error.
- **`sheetName` (Required):** Tab name (e.g., `Sheet1`). *Without parameter:* Fails validation.
- **`range` (Optional):**
  - *With parameter (e.g., `A2:E50`):* Reads specifically within that boundary. If range starts after row 1, headers from row 1 are fetched automatically to preserve column names.
  - *Without parameter (Omitted):* Defaults automatically to `A1:Z`, reading the entire table starting from headers.

#### 2. `append_rows`
- **`spreadsheetId` & `sheetName` (Required):** Target spreadsheet and tab.
- **`mappedColumns` (Required):** Visual mapping of sheet headers to upstream variables.
  - *With parameter:* Appends rows populated with mapped values matching column headers.
  - *Without parameter:* Fails validation or appends empty row.

#### 3. `write_rows`
- **`spreadsheetId` & `sheetName` (Required):** Target spreadsheet and tab.
- **`range` (Required):** Target cell or starting range (e.g., `B2`).
  - *With parameter:* Overwrites cells starting at the designated cell.
  - *Without parameter:* Operation halts with error: `"Target Range / Cell is required for Update Rows operation"`.

#### 4. `clear_rows`
- **`range` (Optional):**
  - *With parameter (e.g., `B2:Z`):* Clears only the specified cells.
  - *Without parameter (Omitted):* Checks `includeHeaderRow`. If false, clears `A2:Z` (preserving headers); if true, clears `A1:Z`.

#### Concrete Input Example (`append_rows`)
- **`spreadsheetId`:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- **`sheetName`:** `Customers`
- **`mappedColumns`:**
  - `Customer Name`: `{{webhook.body.customer.name}}`
  - `Email`: `{{webhook.body.customer.email}}`
  - `Lead Score`: `{{webhook.body.score}}`

#### Predicted Output Structure

**For `read_rows`:**
Returns an array of normalized row objects where keys are lowercase, underscored sheet headers:
```json
[
  {
    "customer_name": "Jane Doe",
    "email": "jane@example.com",
    "lead_score": "85"
  },
  {
    "customer_name": "John Smith",
    "email": "john@example.com",
    "lead_score": "42"
  }
]
```

**For `append_rows` and `write_rows`:**
```json
{
  "googleSheetResponse": {
    "operation": "Append Rows",
    "rowUpdated": "Customers!A3:C3"
  }
}
```

---

### Gmail Node

#### Purpose
Dispatches outbound automated emails via an authorized Gmail account.

#### Authentication
Requires an authorized Google OAuth connection (`gmail_oauth`).

#### Parameter Behavior (With vs. Without Parameters)
- **`To` (Required):**
  - *With parameter:* Recipient email address (e.g., `user@domain.com` or `{{webhook.body.email}}`).
  - *Without parameter:* Execution fails; the failed item is routed to **Handle 1 (`out-1`)** with diagnostic error text.
- **`Subject` (Required):**
  - *With parameter:* Sets outbound subject line.
  - *Without parameter:* Fails validation; routes item to **Handle 1**.
- **`Body` (Required):**
  - *With parameter:* Email body text. Accepts both plain text and HTML markup.
  - *Without parameter:* Fails validation; routes item to **Handle 1**.

#### Concrete Input Example
- **`To`:** `{{webhook.body.customer.email}}`
- **`Subject`:** `Welcome to BuildFlow, {{webhook.body.customer.name}}`
- **`Body`:** `Hello {{webhook.body.customer.name}},\n\nYour account has been created successfully with score {{webhook.body.score}}.`

#### Output Handles and Predicted Output Structure

**Handle 0 (`out-0` - Success):**
Activated when the message is successfully dispatched:
```json
{
  "status": "sent",
  "success": true,
  "messageId": "18f92a10b42c8d9e",
  "threadId": "18f92a10b42c8d9e"
}
```

**Handle 1 (`out-1` - Failed):**
Activated when the send request fails (e.g., invalid email or quota exhaustion):
```json
{
  "status": "failed",
  "success": false,
  "error": "Invalid recipient email address"
}
```

---

### HTTP Request Node

#### Purpose
Provides an HTTP client to communicate with any external REST API or webhook receiver.

#### Authentication
Configured through standard headers (Bearer tokens, basic auth, or custom headers).

#### Parameter Behavior (With vs. Without Parameters)
- **`url` (Required):** Target URL (must begin with `http://`, `https://`, or dynamic `{{...}}`). *Without parameter:* Fails Zod validation (`"URL is required"`).
- **`method` (Optional):** HTTP verb. *Without parameter:* Defaults to `GET`.
- **`headers` (Optional):**
  - *With parameter:* Key-value pairs or JSON string merged into outgoing request headers.
  - *Without parameter:* Default Axios headers applied.
- **`body` (Optional):**
  - *With parameter:* Payload sent with `POST`, `PUT`, or `PATCH`. Ignored on `GET` requests.
  - *Without parameter:* Sends request with no body.
- **`queryParams` (Optional):**
  - *With parameter:* Key-values appended to URL query string.
  - *Without parameter:* No query parameters attached.
- **`timeout` (Optional):** Request timeout in milliseconds. *Without parameter:* Defaults to `30000` (30 seconds).

#### Concrete Input Example (POST Request)
- **`url`:** `https://api.crm.com/v1/leads`
- **`method`:** `POST`
- **`headers`:** `{ "Authorization": "Bearer crm_live_token", "Content-Type": "application/json" }`
- **`body`:**
  ```json
  {
    "name": "{{webhook.body.customer.name}}",
    "email": "{{webhook.body.customer.email}}"
  }
  ```

#### Predicted Output Structure
```json
{
  "statusCode": 201,
  "statusText": "Created",
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "leadId": "lead_98231",
    "status": "verified"
  }
}
```

#### Downstream Usage
- `{{http_request.body.leadId}}` -> `"lead_98231"`
- `{{http_request.statusCode}}` -> `201`

---

### If / Else Node

#### Purpose
Evaluates comparison conditions and directs records to True or False execution paths.

#### Authentication
None required.

#### Parameter Behavior (With vs. Without Parameters)
- **`combinator` (Optional):** Logical rule joining groups (`AND` / `OR`). *Without parameter:* Defaults to `AND`.
- **`operand1` (Required):** Left-side value or variable path.
  - *With parameter:* Resolves dynamic variables (`{{webhook.body.score}}`), nested paths (`user.profile.age`), or array indexes (`items[0]`).
  - *Without parameter (Undefined / Blank):* Evaluates to `undefined`. Unary operators like `is_empty` evaluate to `true`; binary operators like `equals` evaluate to `false`.
- **`operator` (Required):** Condition rule (`equals`, `contains`, `greater_than`, `is_any_of`, `is_empty`, etc.).
- **`operand2` (Conditional):** Right-side comparison target.
  - *With parameter:* Compared against `operand1`.
  - *Without parameter:* Not required for unary checks (`is_empty`, `is_not_empty`, `is_true`, `is_false`). If omitted on binary checks (`equals`, `greater_than`), comparison evaluates to `false`.

#### Concrete Input Example
- **Operand 1:** `{{webhook.body.score}}`
- **Operator:** `greater_than_or_equal`
- **Operand 2:** `80`

#### Output Handles and Predicted Output Structure

**Handle 0 (`out-0` - True Branch):**
Items that satisfy all conditions pass through along Wire 0:
```json
{
  "customer": { "name": "Jane Doe", "email": "jane@example.com" },
  "score": 85
}
```

**Handle 1 (`out-1` - False Branch):**
Items that fail conditions pass through along Wire 1.

**Inactive Branch Behavior:**
When all items evaluate to True, downstream nodes connected to Wire 1 receive an empty dataset and transition to status **`Skipped`**. Downstream processing on inactive paths halts cleanly without triggering workflow errors.

---

### Data Filter Node

#### Purpose
Performs data transformations including deduplication, set comparison, and data grouping.

#### Authentication
None required.

#### Operations and Parameter Behavior (With vs. Without Parameters)

#### 1. `unique_rows` (Deduplication)
- **`sourceData` (Required):** Array of objects to filter. *Without parameter:* Fails validation.
- **`sourceKey` (Optional):**
  - *With parameter (e.g., `email`):* Deduplicates records strictly by that specific key value. If two rows share the same email, the duplicate is routed to Handle 1 (`out-1`).
  - *Without parameter (Omitted):* Invokes deterministic full-row serialization. Performs exact matching across **all columns** (a row is only marked duplicate if every field is 100% identical).

#### 2. `new_data_only`
- **`sourceData` & `referenceData` (Required):** Primary array and baseline array. *Without parameter:* Throws validation error.
- **`sourceKey` & `referenceKey` (Required):** Match keys for comparison. *Without parameters:* Operation fails with error: `"sourceKey and referenceKey are required to compare datasets"`.

#### 3. `existing_data_only`
- **`sourceData` & `referenceData` (Required):** Datasets to intersect.
- **`sourceKey` & `referenceKey` (Required):** Match keys. *Without parameters:* Fails validation.

#### 4. `group_by`
- **`sourceData` (Required):** Dataset to group.
- **`sourceKey` (Required):** Key to group by.
  - *With parameter:* Groups items sharing identical key values into an array of objects: `[ { "groupKey": "Val", "items": [...] } ]`.
  - *Without parameter:* Operation fails with error: `"sourceKey is required to group datasets"`.

#### Concrete Input Example (`unique_rows` by Column)
- **Operation:** `unique_rows`
- **`sourceData`:** `{{google_sheet.rows}}`
- **`sourceKey`:** `email`

#### Predicted Output Structure

**Handle 0 (`out-0` - Unique Records):**
```json
[
  { "name": "Jane Doe", "email": "jane@example.com", "role": "Lead" },
  { "name": "John Smith", "email": "john@example.com", "role": "User" }
]
```

**Handle 1 (`out-1` - Duplicate Records):**
```json
[
  { "name": "Jane Doe (Copy)", "email": "jane@example.com", "role": "Lead" }
]
```

---

### Iterator Node

#### Purpose
Unpacks arrays from a single item into multiple execution items, enabling downstream nodes to execute once for each element in the list.

#### Authentication
None required.

#### Parameter Behavior (With vs. Without Parameters)
- **`arrayPath` (Required):** The path to the array in the upstream output (e.g., `{{http_request.body.orders}}`).
  - *With parameter (resolves to array):* Decomposes the array into individual records.
    - If elements are objects: Emits each object as `{ json: element }`.
    - If elements are primitives (strings/numbers, e.g. `["A", "B"]`): Automatically wraps each element using the last path segment (e.g. `{ "orders": "A" }`).
  - *Without parameter / Unresolved Path:* If `arrayPath` is omitted, fails validation (`"Array Path is required"`). If the path fails to resolve to an array, the node passes the original item through unmodified to prevent data loss.

#### Concrete Input Example
- **`arrayPath`:** `{{http_request.body.line_items}}`
Where upstream output contains:
```json
{
  "orderId": "ORD-101",
  "line_items": [
    { "sku": "MOUSE-01", "quantity": 2, "price": 25 },
    { "sku": "KEYB-02", "quantity": 1, "price": 60 }
  ]
}
```

#### Predicted Output Structure
The Iterator emits individual execution rows sequentially along Handle 0:
- **Emission 1:** `{ "sku": "MOUSE-01", "quantity": 2, "price": 25 }`
- **Emission 2:** `{ "sku": "KEYB-02", "quantity": 1, "price": 60 }`

#### Downstream Usage Example
Downstream nodes connected to the Iterator execute for each item:
- `{{iterator.sku}}` -> `"MOUSE-01"` on first pass, `"KEYB-02"` on second pass.

---

## Standard Workflow Templates

Below are common implementation architectures achievable using BuildFlow's registered nodes:

### 1. Inbound Lead Ingestion and Acknowledgement
- **Sequence:** `Webhook` -> `Google Sheets` -> `Gmail`
- **Application:** Captures registration details from an external form, records lead data into a central spreadsheet, and dispatches an automated onboarding confirmation to the registrant.

### 2. High-Priority Order Routing
- **Sequence:** `Webhook` -> `If / Else` -> Branch True: `Gmail` + `HTTP Request` | Branch False: `Google Sheets`
- **Application:** Evaluates incoming e-commerce transactions. Orders exceeding a specific monetary threshold trigger immediate staff notification and an alert to internal communication channels, while standard orders are logged to archive sheets.

### 3. Contact Deduplication and CRM Synchronization
- **Sequence:** `Google Sheets` -> `Data Filter` -> Branch Unique: `HTTP Request` | Branch Duplicate: `Google Sheets`
- **Application:** Reads a staging contact list, filters duplicate email addresses, synchronizes unique records with a CRM API, and archives duplicate entries to an audit sheet.

### 4. Order Item Line Extraction
- **Sequence:** `Webhook` -> `Iterator` -> `Google Sheets`
- **Application:** Receives multi-item order payloads containing nested product lists, decomposes the collection into distinct line items, and inserts individual records into an inventory tracking table.

### 5. Automated Support Escalation
- **Sequence:** `Webhook` -> `If / Else` -> Branch Urgent: `HTTP Request` + `Gmail` | Branch Standard: `Google Sheets`
- **Application:** Analyzes incoming customer service tickets. Inquiries marked urgent or containing critical keywords trigger immediate on-call incident creation and management notification.

### 6. Scheduled API Delta Notification
- **Sequence:** `HTTP Request` -> `Data Filter` -> `Google Sheets` -> `Gmail`
- **Application:** Polls an external API endpoint, compares the response with a reference sheet to identify newly created records, records updates, and delivers a summary digest.

### 7. Registration Data Enrichment
- **Sequence:** `Webhook` -> `HTTP Request` -> `Google Sheets` -> `Gmail`
- **Application:** Receives basic user signup data, queries a third-party enrichment service for organizational metadata, stores the enriched record, and delivers a tailored onboarding sequence.

### 8. Feedback Segmentation and Triage
- **Sequence:** `Google Sheets` -> `Iterator` -> `If / Else` -> Dynamic `Gmail` Dispatch
- **Application:** Iterates through submitted customer satisfaction responses. Low scores initiate an automated review outreach from support leadership, while positive responses receive a public review invitation.

### 9. Webhook Normalization and API Proxy
- **Sequence:** `Webhook` -> `Data Filter` -> `HTTP Request` -> `Gmail`
- **Application:** Acts as an integration middleware, ingesting heterogeneous event streams, stripping invalid payloads, mapping schemas, forwarding requests to a target API, and dispatching audit notices upon failure.

### 10. Batch Outreach with Delivery Auditing
- **Sequence:** `Google Sheets` -> `Iterator` -> `Gmail` -> Branch Success / Failure: `Google Sheets`
- **Application:** Dispatches batch notifications across a recipient list, utilizing dual output handles to update spreadsheet status columns to "Delivered" on success or log diagnostic errors to a review tab on failure.

---

## Variable Interpolation

Data is transferred between nodes using double curly brace syntax: `{{...}}`.

### Resolution Rules
1. **Direct Property Lookup:** `{{webhook.body.customer.email}}`
2. **Action Node Output:** `{{google_sheet.rows[0].id}}`
3. **HTTP Response Data:** `{{http_request.body.token}}`
4. **String Composition:** Static text and dynamic variables can be combined freely within text inputs:
   ```text
   Notification: Order {{webhook.body.orderId}} has been processed for {{webhook.body.customer.name}}.
   ```

---

## Branch Routing and Status Lifecycle

BuildFlow uses a two-dimensional output matrix (`[wireIndex][rowIndex]`) to handle multi-branch routing.

```
                  [ Conditional Node ]
                           |
             +-------------+-------------+
             |                           |
       Wire 0 (Active)             Wire 1 (Inactive)
             |                           |
             v                           v
      [ Executed Node ]           [ Skipped Node ]
```

### Execution Statuses
- **`Start`:** The workflow run has been initialized.
- **`Pending`:** The execution is committed to the transactional outbox and queued.
- **`InProgress`:** A worker instance has claimed the job and is evaluating nodes.
- **`Completed`:** All nodes in active execution paths finished successfully.
- **`Skipped`:** A branch received an empty dataset (e.g., condition evaluated False). Downstream nodes on that branch are safely bypassed without failing the workflow.
- **`Failed`:** A node encountered an unhandled error or exhausted retry attempts.

---

## System Architecture

BuildFlow follows a microservices architecture with an event-driven execution model:

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

<img width="1916" height="817" alt="BuildFlow Workflow Canvas" src="docs/assets/workflow-canvas.png" />

### Execution Flow
1. **Trigger Event:** External HTTP request arrives at the Hooks service.
2. **Transaction Outbox:** Workflow execution record created atomically with outbox entry.
3. **Event Publishing:** Processor sweeps outbox and publishes execution events to Kafka.
4. **Execution:** Worker consumes messages, executes nodes sequentially, and manages branches.
5. **Status Tracking:** Node execution states and outputs are persisted to PostgreSQL and streamed live to the UI.

---

## Technology Stack

- **Application Framework:** Next.js (Frontend), Express.js (Backend Services)
- **Visual Canvas:** React Flow (`@xyflow/react`)
- **Message Broker:** Apache Kafka
- **Database & ORM:** PostgreSQL with Prisma ORM
- **State Management:** Redux Toolkit
- **Process Orchestration:** Turborepo and pnpm workspaces

---

## Project Structure

```
BuildFlow/
├── apps/
│   ├── web/                    # Next.js management frontend
│   ├── http-backend/           # Core API and workflow service
│   ├── hooks/                  # Ingestion gateway for webhooks
│   ├── processor/              # Outbox queue publisher
│   └── worker/                 # Distributed workflow execution engine
│
├── packages/
│   ├── db/                     # Prisma database schema and client
│   ├── nodes/                  # Node definitions and execution handlers
│   ├── kafka/                  # Queue client configurations and telemetry
│   ├── common/                 # Validation schemas and interpolation engine
│   └── ui/                     # Shared interface components
│
├── turbo.json                  # Monorepo build pipeline
└── pnpm-workspace.yaml         # Workspace configuration
```

---

## Environment Configuration

BuildFlow is a monorepo consisting of multiple services. Configure environment variables for each individual service as outlined below.

### 1. Web Application (`apps/web/.env`)
```env
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Backend Endpoints
NEXT_PUBLIC_BACKEND_URL="http://localhost:3002"
NEXT_PUBLIC_HOOKS_URL="http://localhost:3003"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/auth/google/callback"

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/buildflow?pgbouncer=true"
DIRECT_URL="postgresql://user:password@localhost:5432/buildflow"

# Optional GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
NEXT_PUBLIC_GITHUB_ENABLED="false"
```

### 2. HTTP Backend API (`apps/http-backend/.env`)
```env
PORT=3002
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/buildflow?pgbouncer=true"

# Apache Kafka Configuration
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="buildflow-backend"
# Optional SASL / Cloud Kafka (Aiven / Confluent)
# KAFKA_USERNAME="your-username"
# KAFKA_PASSWORD="your-password"
# KAFKA_MECHANISM="scram-sha-256"

# CORS and Origin Configuration
ALLOWED_ORIGINS="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
HOOKS_URL="http://localhost:3003"

# Google OAuth Settings
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/auth/google/callback"
```

### 3. Webhook Ingestion Service (`apps/hooks/.env`)
```env
PORT=3003
DATABASE_URL="postgresql://user:password@localhost:5432/buildflow?pgbouncer=true"

# Apache Kafka Configuration
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="buildflow-hooks"
# Optional SASL Configuration
# KAFKA_USERNAME="your-username"
# KAFKA_PASSWORD="your-password"
# KAFKA_MECHANISM="scram-sha-256"
```

### 4. Processor Service (`apps/processor/.env`)
```env
# Database Connection (Direct Connection for PG LISTEN/NOTIFY and polling)
DATABASE_URL="postgresql://user:password@localhost:5432/buildflow?pgbouncer=true"
DIRECT_URL="postgresql://user:password@localhost:5432/buildflow"

# Apache Kafka Configuration
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="buildflow-processor"
# Optional SASL Configuration
# KAFKA_USERNAME="your-username"
# KAFKA_PASSWORD="your-password"
# KAFKA_MECHANISM="scram-sha-256"
```

### 5. Worker Service (`apps/worker/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/buildflow?pgbouncer=true"

# Apache Kafka Configuration
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="buildflow-worker"
# Optional SASL Configuration
# KAFKA_USERNAME="your-username"
# KAFKA_PASSWORD="your-password"
# KAFKA_MECHANISM="scram-sha-256"

# Google OAuth (for automated token refresh and execution)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 6. Database Package (`packages/db/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/buildflow?pgbouncer=true"
DIRECT_URL="postgresql://user:password@localhost:5432/buildflow"
```

---

## Getting Started

### Prerequisites
- Node.js (v20 or v22 LTS)
- pnpm (v10 or later)
- PostgreSQL database instance
- Apache Kafka message broker

### Quickstart
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dev-Pross/BuildFlow.git
   cd BuildFlow
   ```
2. **Install monorepo dependencies:**
   ```bash
   pnpm install
   ```
3. **Configure environment variables:**
   Populate the `.env` files in each service directory according to the [Environment Configuration](#environment-configuration) section above.
4. **Generate the database client and apply migrations:**
   ```bash
   pnpm --filter @repo/db prisma generate
   pnpm --filter @repo/db prisma migrate dev
   ```
5. **Start Apache Kafka (via Docker):**
   ```bash
   docker run -d --name buildflow-kafka -p 9092:9092 apache/kafka:latest
   ```
6. **Launch all services in development mode:**
   ```bash
   pnpm dev
   ```
   Services initialized:
   - Web Application: `http://localhost:3000`
   - HTTP Backend API: `http://localhost:3002`
   - Webhook Ingestion API: `http://localhost:3003`
   - Processor & Worker: Background daemons

---

## Integrations and Authentication

To utilize Google Workspace actions (Google Sheets, Gmail):
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Sheets API** and **Gmail API** under APIs & Services.
3. Configure the **OAuth Consent Screen** (User Type: External).
4. Create an **OAuth 2.0 Client ID** (Application type: Web application).
5. Set the **Authorized Redirect URI** matching your backend deployment domain:
   ```text
   https://<your-backend-domain>/auth/google/callback
   ```
6. Copy `Client ID` and `Client Secret` into the respective service `.env` files.

---

## Deployment Guidelines

- **Stateless Webhook Scaling:** Deploy `apps/hooks` in horizontally scalable container environments (e.g., Cloud Run or Kubernetes) to absorb burst webhook volume.
- **Worker Concurrency:** Scale `apps/worker` horizontally by aligning instance counts with the partition count of the Kafka execution topic.
- **Database Optimization:** Ensure indices on `WorkflowExecution(workflowId, startAt)` are active to maintain low query latency as execution history grows.

---

## Troubleshooting

- **Downstream Nodes Skipped:** If an execution ends with `Skipped` nodes, inspect upstream `If / Else` or `Filter` evaluations to confirm whether data was routed along an alternate branch.
- **Webhook Not Delivering:** Ensure the caller is using the full endpoint URL provided in the workflow canvas and that the request method is `POST` with a valid JSON body.
- **OAuth Callback Mismatch:** Verify that the registered Redirect URI in Google Cloud Console matches the host and protocol of the backend service without trailing slashes.

---

## Authors and License

Developed and maintained by the BuildFlow core team.

Licensed under the [MIT License](./LICENSE).
