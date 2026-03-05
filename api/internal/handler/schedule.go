package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func ScheduleRoutes(r chi.Router) {
	r.Get("/", listSchedules)
	r.Post("/", createSchedule)
	r.Put("/{scheduleID}", updateSchedule)
	r.Delete("/{scheduleID}", deleteSchedule)
}

func listSchedules(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusOK, []any{}) }
func createSchedule(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusCreated, map[string]any{}) }
func updateSchedule(w http.ResponseWriter, r *http.Request)  { respondJSON(w, http.StatusOK, map[string]any{}) }
func deleteSchedule(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusNoContent) }
