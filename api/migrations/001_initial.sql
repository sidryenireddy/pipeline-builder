CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE pipelines (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    owner_id    TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE branches (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    parent_id   UUID REFERENCES branches(id),
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pipeline_id, name)
);

CREATE TABLE transforms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    config      JSONB NOT NULL DEFAULT '{}',
    position_x  DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y  DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE edges (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id         UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    source_transform_id UUID NOT NULL REFERENCES transforms(id) ON DELETE CASCADE,
    target_transform_id UUID NOT NULL REFERENCES transforms(id) ON DELETE CASCADE,
    source_port         TEXT NOT NULL DEFAULT 'output',
    target_port         TEXT NOT NULL DEFAULT 'input',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE builds (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'pending',
    triggered_by TEXT NOT NULL,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE schedules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    cron        TEXT NOT NULL,
    enabled     BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE data_expectations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transform_id UUID NOT NULL REFERENCES transforms(id) ON DELETE CASCADE,
    column_name  TEXT NOT NULL,
    rule         TEXT NOT NULL,
    config       JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transforms_pipeline ON transforms(pipeline_id, branch_id);
CREATE INDEX idx_edges_pipeline ON edges(pipeline_id, branch_id);
CREATE INDEX idx_builds_pipeline ON builds(pipeline_id);
CREATE INDEX idx_builds_status ON builds(status);
