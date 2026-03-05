package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func BuildRoutes(r chi.Router) {
	r.Get("/", listBuilds)
	r.Post("/", triggerBuild)
	r.Get("/{buildID}", getBuild)
	r.Post("/{buildID}/cancel", cancelBuild)
}

func listBuilds(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusOK, []any{}) }
func triggerBuild(w http.ResponseWriter, r *http.Request) { respondJSON(w, http.StatusCreated, map[string]any{}) }
func getBuild(w http.ResponseWriter, r *http.Request)     { respondJSON(w, http.StatusOK, map[string]any{}) }
func cancelBuild(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusOK, map[string]any{}) }
