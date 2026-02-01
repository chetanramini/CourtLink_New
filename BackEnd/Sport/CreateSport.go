package Sport

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

// CreateSport godoc
// @Summary      Create a new sport record
// @Description  Adds a new sport to the database if it does not already exist. Requires Sport_name as input.
// @Tags         sports
// @Accept       json
// @Produce      json
// @Param        sport  body      DataBase.Sport  true  "Sport object"
// @Success      201    {object}  map[string]interface{}  "Sport record added successfully"  example({"message": "Sport record added successfully!!", "sport": {"Sport_ID": 1, "Sport_name": "Tennis"}})
// @Failure      400    {string}  string  "Sport_name is required or the sport already exists or invalid request body"
// @Failure      500    {string}  string  "Internal Server Error"
// @Router       /CreateSport [post]
func CreateSport(w http.ResponseWriter, r *http.Request) {
	var s DataBase.Sport
	err := json.NewDecoder(r.Body).Decode(&s)

	w.Header().Set("Content-Type", "application/json")

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
		return
	}

	if s.Sport_name == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Sport_name is required"})
		return
	}

	var existingSport DataBase.Sport
	// Case sensitive lookup
	result := DataBase.DB.Where("\"Sport_name\" = ?", s.Sport_name).First(&existingSport)

	if result.RowsAffected > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "The sport record already exists"})
		return
	}

	if err := DataBase.DB.Create(&s).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	response := map[string]interface{}{
		"message": "Sport record added successfully!!",
		"sport":   s,
	}
	json.NewEncoder(w).Encode(response)
}
