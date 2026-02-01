package Sport

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

// ResetSportCourts godoc
// @Summary      Reset all courts for a sport
// @Description  Resets availability of all courts associated with a specific sport.
// @Tags         sports
// @Accept       json
// @Produce      json
// @Param        sport_name  body  string  true  "Sport Name"
// @Success      200  {object}  map[string]string  "Courts reset successfully"
// @Failure      400  {object}  map[string]string  "Invalid request"
// @Failure      404  {object}  map[string]string  "Sport not found"
// @Router       /resetSportCourts [post]
func ResetSportCourts(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		SportName string `json:"Sport_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
		return
	}

	// 1. Find Sport
	var sport DataBase.Sport
	if err := DataBase.DB.Where("\"Sport_name\" = ?", requestData.SportName).First(&sport).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"message": "Sport not found"})
		return
	}

	// 2. Find all courts for this sport
	var courts []DataBase.Court
	if err := DataBase.DB.Where("Sport_id = ?", sport.Sport_ID).Find(&courts).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Error finding courts"})
		return
	}

	// 3. Reset TimeSlots AND Cancel Bookings for each court
	tx := DataBase.DB.Begin()
	for _, court := range courts {
		// Reset logic: Update court_time_slots set all slots = 1 where court_id = ...
		if err := tx.Model(&DataBase.Court_TimeSlots{}).Where("Court_ID = ?", court.Court_ID).Updates(map[string]interface{}{
			"slot_08_09": 1, "slot_09_10": 1, "slot_10_11": 1,
			"slot_11_12": 1, "slot_12_13": 1, "slot_13_14": 1,
			"slot_14_15": 1, "slot_15_16": 1, "slot_16_17": 1,
			"slot_17_18": 1,
		}).Error; err != nil {
			tx.Rollback()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to reset slots for court: " + court.Court_Name})
			return
		}

		// Cancel Bookings Logic
		if err := tx.Model(&DataBase.Bookings{}).
			Where("\"Court_ID\" = ? AND \"Booking_Status\" = ?", court.Court_ID, "booked").
			Update("Booking_Status", "Cancelled").Error; err != nil {
			tx.Rollback()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to cancel bookings for court: " + court.Court_Name})
			return
		}
	}
	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "All courts for " + requestData.SportName + " have been reset."})
}
