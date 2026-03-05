package model

import (
	"time"

	"github.com/google/uuid"
)

type TransformType string

const (
	TransformFilter     TransformType = "filter"
	TransformJoin       TransformType = "join"
	TransformUnion      TransformType = "union"
	TransformAggregate  TransformType = "aggregate"
	TransformPivot      TransformType = "pivot"
	TransformRename     TransformType = "rename"
	TransformCast       TransformType = "cast"
	TransformSort       TransformType = "sort"
	TransformDeduplicate TransformType = "deduplicate"
	TransformExpression TransformType = "expression"
	TransformLLM        TransformType = "llm"
	TransformInput      TransformType = "input"
	TransformOutput     TransformType = "output"
)

type BuildStatus string

const (
	BuildPending  BuildStatus = "pending"
	BuildRunning  BuildStatus = "running"
	BuildSuccess  BuildStatus = "success"
	BuildFailed   BuildStatus = "failed"
	BuildCanceled BuildStatus = "canceled"
)

type Pipeline struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Description string     `json:"description" db:"description"`
	OwnerID     string     `json:"owner_id" db:"owner_id"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Transform struct {
	ID         uuid.UUID     `json:"id" db:"id"`
	PipelineID uuid.UUID     `json:"pipeline_id" db:"pipeline_id"`
	BranchID   uuid.UUID     `json:"branch_id" db:"branch_id"`
	Type       TransformType `json:"type" db:"type"`
	Name       string        `json:"name" db:"name"`
	Config     []byte        `json:"config" db:"config"`
	PositionX  float64       `json:"position_x" db:"position_x"`
	PositionY  float64       `json:"position_y" db:"position_y"`
	CreatedAt  time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at" db:"updated_at"`
}

type Edge struct {
	ID              uuid.UUID `json:"id" db:"id"`
	PipelineID      uuid.UUID `json:"pipeline_id" db:"pipeline_id"`
	BranchID        uuid.UUID `json:"branch_id" db:"branch_id"`
	SourceTransform uuid.UUID `json:"source_transform_id" db:"source_transform_id"`
	TargetTransform uuid.UUID `json:"target_transform_id" db:"target_transform_id"`
	SourcePort      string    `json:"source_port" db:"source_port"`
	TargetPort      string    `json:"target_port" db:"target_port"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type Build struct {
	ID         uuid.UUID   `json:"id" db:"id"`
	PipelineID uuid.UUID   `json:"pipeline_id" db:"pipeline_id"`
	BranchID   uuid.UUID   `json:"branch_id" db:"branch_id"`
	Status     BuildStatus `json:"status" db:"status"`
	TriggeredBy string     `json:"triggered_by" db:"triggered_by"`
	StartedAt  *time.Time  `json:"started_at,omitempty" db:"started_at"`
	FinishedAt *time.Time  `json:"finished_at,omitempty" db:"finished_at"`
	Error      string      `json:"error,omitempty" db:"error"`
	CreatedAt  time.Time   `json:"created_at" db:"created_at"`
}

type Schedule struct {
	ID         uuid.UUID `json:"id" db:"id"`
	PipelineID uuid.UUID `json:"pipeline_id" db:"pipeline_id"`
	BranchID   uuid.UUID `json:"branch_id" db:"branch_id"`
	Cron       string    `json:"cron" db:"cron"`
	Enabled    bool      `json:"enabled" db:"enabled"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type Branch struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	PipelineID uuid.UUID  `json:"pipeline_id" db:"pipeline_id"`
	Name       string     `json:"name" db:"name"`
	ParentID   *uuid.UUID `json:"parent_id,omitempty" db:"parent_id"`
	IsDefault  bool       `json:"is_default" db:"is_default"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
}

type DataExpectation struct {
	ID          uuid.UUID `json:"id" db:"id"`
	TransformID uuid.UUID `json:"transform_id" db:"transform_id"`
	Column      string    `json:"column" db:"column"`
	Rule        string    `json:"rule" db:"rule"`
	Config      []byte    `json:"config" db:"config"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}
