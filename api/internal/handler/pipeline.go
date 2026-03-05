package handler

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type pipelineRecord struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type transformRecord struct {
	ID         string         `json:"id"`
	PipelineID string         `json:"pipeline_id"`
	Type       string         `json:"type"`
	Name       string         `json:"name"`
	Config     map[string]any `json:"config"`
	PositionX  float64        `json:"position_x"`
	PositionY  float64        `json:"position_y"`
	CreatedAt  string         `json:"created_at"`
	UpdatedAt  string         `json:"updated_at"`
}

type edgeRecord struct {
	ID                string `json:"id"`
	PipelineID        string `json:"pipeline_id"`
	SourceTransformID string `json:"source_transform_id"`
	TargetTransformID string `json:"target_transform_id"`
	SourcePort        string `json:"source_port"`
	TargetPort        string `json:"target_port"`
	CreatedAt         string `json:"created_at"`
}

var (
	mu         sync.RWMutex
	pipelines  = map[string]*pipelineRecord{}
	transforms = map[string]*transformRecord{}
	edges      = map[string]*edgeRecord{}
)

func PipelineRoutes(r chi.Router) {
	r.Get("/", listPipelines)
	r.Post("/", createPipeline)
	r.Route("/{pipelineID}", func(r chi.Router) {
		r.Get("/", getPipeline)
		r.Put("/", updatePipeline)
		r.Delete("/", deletePipeline)
		r.Route("/branches", BranchRoutes)
		r.Route("/transforms", TransformRoutes)
		r.Route("/edges", EdgeRoutes)
	})
}

func BranchRoutes(r chi.Router) {
	r.Get("/", listBranches)
	r.Post("/", createBranch)
	r.Get("/{branchID}", getBranch)
}

func TransformRoutes(r chi.Router) {
	r.Get("/", listTransforms)
	r.Post("/", createTransform)
	r.Put("/{transformID}", updateTransform)
	r.Delete("/{transformID}", deleteTransform)
	r.Post("/{transformID}/preview", previewTransform)
}

func EdgeRoutes(r chi.Router) {
	r.Get("/", listEdges)
	r.Post("/", createEdge)
	r.Delete("/{edgeID}", deleteEdge)
}

// --- Pipelines ---

func listPipelines(w http.ResponseWriter, r *http.Request) {
	mu.RLock()
	defer mu.RUnlock()
	result := make([]*pipelineRecord, 0, len(pipelines))
	for _, p := range pipelines {
		result = append(result, p)
	}
	respondJSON(w, http.StatusOK, result)
}

type CreatePipelineRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func createPipeline(w http.ResponseWriter, r *http.Request) {
	var req CreatePipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	now := time.Now().UTC().Format(time.RFC3339)
	p := &pipelineRecord{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	mu.Lock()
	pipelines[p.ID] = p
	mu.Unlock()
	respondJSON(w, http.StatusCreated, p)
}

func getPipeline(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "pipelineID")
	mu.RLock()
	p, ok := pipelines[id]
	mu.RUnlock()
	if !ok {
		respondError(w, http.StatusNotFound, "pipeline not found")
		return
	}

	// Gather transforms and edges for this pipeline
	mu.RLock()
	var ts []*transformRecord
	for _, t := range transforms {
		if t.PipelineID == id {
			ts = append(ts, t)
		}
	}
	var es []*edgeRecord
	for _, e := range edges {
		if e.PipelineID == id {
			es = append(es, e)
		}
	}
	mu.RUnlock()

	respondJSON(w, http.StatusOK, map[string]any{
		"id":          p.ID,
		"name":        p.Name,
		"description": p.Description,
		"created_at":  p.CreatedAt,
		"updated_at":  p.UpdatedAt,
		"transforms":  ts,
		"edges":       es,
	})
}

func updatePipeline(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "pipelineID")
	var req CreatePipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	mu.Lock()
	p, ok := pipelines[id]
	if !ok {
		mu.Unlock()
		respondError(w, http.StatusNotFound, "pipeline not found")
		return
	}
	p.Name = req.Name
	p.Description = req.Description
	p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	mu.Unlock()
	respondJSON(w, http.StatusOK, p)
}

func deletePipeline(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "pipelineID")
	mu.Lock()
	delete(pipelines, id)
	// Clean up transforms and edges
	for tid, t := range transforms {
		if t.PipelineID == id {
			delete(transforms, tid)
		}
	}
	for eid, e := range edges {
		if e.PipelineID == id {
			delete(edges, eid)
		}
	}
	mu.Unlock()
	w.WriteHeader(http.StatusNoContent)
}

// --- Branches (stubs) ---

func listBranches(w http.ResponseWriter, r *http.Request) { respondJSON(w, http.StatusOK, []any{}) }
func createBranch(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusCreated, map[string]any{}) }
func getBranch(w http.ResponseWriter, r *http.Request)     { respondJSON(w, http.StatusOK, map[string]any{}) }

// --- Transforms ---

type CreateTransformRequest struct {
	Type      string         `json:"type"`
	Name      string         `json:"name"`
	Config    map[string]any `json:"config"`
	PositionX float64        `json:"position_x"`
	PositionY float64        `json:"position_y"`
}

func listTransforms(w http.ResponseWriter, r *http.Request) {
	pipelineID := chi.URLParam(r, "pipelineID")
	mu.RLock()
	defer mu.RUnlock()
	var result []*transformRecord
	for _, t := range transforms {
		if t.PipelineID == pipelineID {
			result = append(result, t)
		}
	}
	if result == nil {
		result = []*transformRecord{}
	}
	respondJSON(w, http.StatusOK, result)
}

func createTransform(w http.ResponseWriter, r *http.Request) {
	pipelineID := chi.URLParam(r, "pipelineID")
	mu.RLock()
	_, ok := pipelines[pipelineID]
	mu.RUnlock()
	if !ok {
		respondError(w, http.StatusNotFound, "pipeline not found")
		return
	}

	var req CreateTransformRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	t := &transformRecord{
		ID:         uuid.New().String(),
		PipelineID: pipelineID,
		Type:       req.Type,
		Name:       req.Name,
		Config:     req.Config,
		PositionX:  req.PositionX,
		PositionY:  req.PositionY,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if t.Config == nil {
		t.Config = map[string]any{}
	}
	mu.Lock()
	transforms[t.ID] = t
	mu.Unlock()
	respondJSON(w, http.StatusCreated, t)
}

func updateTransform(w http.ResponseWriter, r *http.Request) {
	transformID := chi.URLParam(r, "transformID")
	var req CreateTransformRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	mu.Lock()
	t, ok := transforms[transformID]
	if !ok {
		mu.Unlock()
		respondError(w, http.StatusNotFound, "transform not found")
		return
	}
	t.Type = req.Type
	t.Name = req.Name
	t.Config = req.Config
	t.PositionX = req.PositionX
	t.PositionY = req.PositionY
	t.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	mu.Unlock()
	respondJSON(w, http.StatusOK, t)
}

func deleteTransform(w http.ResponseWriter, r *http.Request) {
	transformID := chi.URLParam(r, "transformID")
	mu.Lock()
	delete(transforms, transformID)
	mu.Unlock()
	w.WriteHeader(http.StatusNoContent)
}

func previewTransform(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]any{"rows": []any{}, "columns": []any{}})
}

// --- Edges ---

type CreateEdgeRequest struct {
	SourceTransformID string `json:"source_transform_id"`
	TargetTransformID string `json:"target_transform_id"`
	SourcePort        string `json:"source_port"`
	TargetPort        string `json:"target_port"`
}

func listEdges(w http.ResponseWriter, r *http.Request) {
	pipelineID := chi.URLParam(r, "pipelineID")
	mu.RLock()
	defer mu.RUnlock()
	var result []*edgeRecord
	for _, e := range edges {
		if e.PipelineID == pipelineID {
			result = append(result, e)
		}
	}
	if result == nil {
		result = []*edgeRecord{}
	}
	respondJSON(w, http.StatusOK, result)
}

func createEdge(w http.ResponseWriter, r *http.Request) {
	pipelineID := chi.URLParam(r, "pipelineID")
	mu.RLock()
	_, ok := pipelines[pipelineID]
	mu.RUnlock()
	if !ok {
		respondError(w, http.StatusNotFound, "pipeline not found")
		return
	}

	var req CreateEdgeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.SourcePort == "" {
		req.SourcePort = "output"
	}
	if req.TargetPort == "" {
		req.TargetPort = "input"
	}

	e := &edgeRecord{
		ID:                uuid.New().String(),
		PipelineID:        pipelineID,
		SourceTransformID: req.SourceTransformID,
		TargetTransformID: req.TargetTransformID,
		SourcePort:        req.SourcePort,
		TargetPort:        req.TargetPort,
		CreatedAt:         time.Now().UTC().Format(time.RFC3339),
	}
	mu.Lock()
	edges[e.ID] = e
	mu.Unlock()
	respondJSON(w, http.StatusCreated, e)
}

func deleteEdge(w http.ResponseWriter, r *http.Request) {
	edgeID := chi.URLParam(r, "edgeID")
	mu.Lock()
	delete(edges, edgeID)
	mu.Unlock()
	w.WriteHeader(http.StatusNoContent)
}

// --- Helpers ---

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
