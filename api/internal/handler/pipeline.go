package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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

type CreatePipelineRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func listPipelines(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, []any{})
}

func createPipeline(w http.ResponseWriter, r *http.Request) {
	var req CreatePipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	respondJSON(w, http.StatusCreated, map[string]any{
		"id":          uuid.New(),
		"name":        req.Name,
		"description": req.Description,
	})
}

func getPipeline(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"id": chi.URLParam(r, "pipelineID")})
}

func updatePipeline(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"id": chi.URLParam(r, "pipelineID")})
}

func deletePipeline(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

func listBranches(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusOK, []any{}) }
func createBranch(w http.ResponseWriter, r *http.Request)   { respondJSON(w, http.StatusCreated, map[string]any{}) }
func getBranch(w http.ResponseWriter, r *http.Request)      { respondJSON(w, http.StatusOK, map[string]any{}) }
func listTransforms(w http.ResponseWriter, r *http.Request) { respondJSON(w, http.StatusOK, []any{}) }
func createTransform(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusCreated, map[string]any{})
}
func updateTransform(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]any{})
}
func deleteTransform(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }
func previewTransform(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]any{"rows": []any{}, "columns": []any{}})
}

func listEdges(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusOK, []any{}) }
func createEdge(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusCreated, map[string]any{}) }
func deleteEdge(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusNoContent) }

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
