# Pipeline Builder

Visual, no-code data transformation platform. Sits downstream of [Data Connection](https://connect.rebelinc.ai) — reads datasets produced by Data Connection as inputs, lets users visually chain transforms, preview results at each step, and deliver outputs as new clean datasets.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + React Flow)                                │
│  Visual DAG editor, transform config, live data preview         │
├─────────────────────────────────────────────────────────────────┤
│  API (Go)                                                       │
│  Pipeline CRUD, build orchestration, version control,           │
│  scheduling, branch management                                  │
├─────────────────────────────────────────────────────────────────┤
│  Engine (Python)                                                │
│  Receives pipeline DAG, resolves execution plan,                │
│  runs transforms via PySpark/Pandas, returns results            │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL          │  Spark (via Engine)                      │
│  Metadata store      │  Distributed compute                    │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
/api         Go control plane — pipeline CRUD, build orchestration,
             version control, scheduling, branch management
/engine      Python execution engine — receives a pipeline DAG,
             resolves it into a Spark/Pandas execution plan,
             runs transforms, returns results
/frontend    Next.js visual pipeline builder — React Flow DAG editor
             with custom transform nodes, configuration panel,
             live data preview, output delivery
/spec        OpenAPI definitions shared across components
```

## Domain Model

| Entity            | Description                                                  |
|-------------------|--------------------------------------------------------------|
| **Pipeline**      | A named, versioned DAG of transforms                         |
| **Transform**     | A single operation node (filter, join, aggregate, etc.)      |
| **Edge**          | A directed connection between two transforms                 |
| **Build**         | An execution run of a pipeline at a point in time            |
| **Schedule**      | A cron-based or event-driven trigger for builds              |
| **Branch**        | A named version branch of a pipeline (like git branches)     |
| **DataExpectation** | A validation rule applied to transform outputs             |

## Supported Transforms

- Filter, Join, Union, Aggregate, Pivot
- Rename, Cast, Sort, Deduplicate
- Custom Expressions
- LLM Transforms (AI-powered column generation)

## Tech Stack

- **Backend API**: Go
- **Execution Engine**: Python (PySpark + Pandas)
- **Frontend**: Next.js, TypeScript, React Flow
- **Database**: PostgreSQL
- **Compute**: Apache Spark (via Docker)

## Getting Started

```bash
# Start all services
make up

# Run in development mode
make dev

# Run tests
make test

# Stop all services
make down
```

## Design System

White background, black sidebar with Rebel Inc. logo. No emojis. Red accents only (`#DC2626`).
