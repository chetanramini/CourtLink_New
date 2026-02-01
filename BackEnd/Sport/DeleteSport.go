package Sport

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

// DeleteSport godoc
// @Summary      Delete a sport record
// @Description  Deletes a sport and all associated courts/bookings.
// @Tags         sports
// @Accept       json
// @Produce      json
// @Param        sport_name  query     string  true  "Sport Name to be deleted"
// @Success      200  {object}  map[string]string  "Sport deleted successfully"
// @Failure      400  {object}  map[string]string  "Invalid sport name"
// @Failure      404  {object}  map[string]string  "Sport not found"
// @Failure      500  {object}  map[string]string  "Internal server error"
// @Router       /DeleteSport [delete]
func DeleteSport(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		SportName string `json:"Sport_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
		return
	}

	// Start transaction
	tx := DataBase.DB.Begin()

	var sport DataBase.Sport
	// Case sensitive handling for Sport_name
	if err := tx.Where("\"Sport_name\" = ?", requestData.SportName).First(&sport).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"message": "Sport not found"})
		return
	}

	// Cascade delete Courts -> TimeSlots -> Bookings (GORM might handle this if constraints are set, but let's be safe)
	// 1. Find all courts
	var courts []DataBase.Court
	if err := tx.Where("Sport_id = ?", sport.Sport_ID).Find(&courts).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to fetch associated courts"})
		return
	}

	for _, court := range courts {
		// Delete TimeSlots
		if err := tx.Where("Court_ID = ?", court.Court_ID).Delete(&DataBase.Court_TimeSlots{}).Error; err != nil {
			tx.Rollback()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to delete court time slots"})
			return
		}
		// Bookings should also be deleted or kept? Usually cascaded. 
		// Assuming DB constraint handles bookings or we leave them as orphan/history?
		// Let's delete bookings for safety if not handled by FK
		if err := tx.Where("Court_ID = ?", court.Court_ID).Delete(&DataBase.Bookings{}).Error; err != nil {
			tx.Rollback()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to delete bookings"})
			return
		}
	}

	// Delete Courts
	if err := tx.Where("Sport_id = ?", sport.Sport_ID).Delete(&DataBase.Court{}).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to delete courts"})
		return
	}

	// Delete Sport
	if err := tx.Delete(&sport).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to delete sport"})
		return
	}

	tx.Commit()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Sport and all associated courts deleted successfully"})
}
