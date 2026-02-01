package Court

import (
	"BackEnd/DataBase"
	"encoding/json"
	"fmt"
	"net/http"
)

type CourtData struct {
	CourtName string `json:"court_name"`
	SportName string `json:"sport_name"`
}

// ListCourts godoc
// @Summary      List all courts with their associated sports
// @Description  Retrieves a list of all courts along with the corresponding sport details.
// @Tags         courts
// @Accept       json
// @Produce      json
// @Success      200    {array}   DataBase.Court  "List of courts and their associated sports"
// @Failure      500    {string}  string  "Database error while fetching courts"
// @Router       /ListCourts [get]
func ListCourts(w http.ResponseWriter, r *http.Request) {
	var courts []DataBase.Court

	// Use GORM Preload to fetch the associated Sport for each court
	err := DataBase.DB.Preload("Sport").Find(&courts).Error

	if err != nil {
		fmt.Println("Failed to fetch courts:", err)
		http.Error(w, "Failed to fetch courts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(courts)
}
