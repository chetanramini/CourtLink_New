package Court

import (
	"BackEnd/DataBase"
	"encoding/json"
	"fmt"
	"net/http"
)

// GetCourt retrieves available courts for a given sport.
//
// @Summary Get court availability
// @Description Fetches courts based on the selected sport and provides their availability status along with time slots.
// @Tags courts
// @Accept  json
// @Produce  json
// @Param  sport query string true "Sport name"
// @Success 200 {array} DataBase.CourtAvailability "List of available courts with time slots"
// @Failure 400 {object} DataBase.ErrorResponse "Missing 'sport' query parameter"
// @Failure 404 {object} DataBase.ErrorResponse "Sport not found or no courts available"
// @Router /getCourts [get]
func GetCourt(w http.ResponseWriter, r *http.Request) {
	var sport DataBase.Sport
	type CourtInfo struct {
		CourtID     uint   `gorm:"column:Court_ID"`
		CourtName   string `gorm:"column:Court_Name"`
		CourtStatus uint   `gorm:"column:Court_Status"`
		SportID     uint   `gorm:"column:Sport_id"`
	}
	var courtData []CourtInfo
	sportName := r.URL.Query().Get("sport")

	if sportName == "" {
		http.Error(w, "Missing 'sport' query parameter", http.StatusBadRequest)
		return
	}

	fmt.Println("Sport Selection:", sportName)

	// Check if sport exists
	if err := DataBase.DB.Where("\"Sport_name\" = ?", sportName).First(&sport).Error; err != nil {
		fmt.Println("Sport not found:", err)
		http.Error(w, "Sport not found", http.StatusNotFound)
		return
	}

	// Fetch courts for the given sport
	if err := DataBase.DB.Model(&DataBase.Court{}).
		Select("\"Court_ID\", \"Court_Name\", \"Court_Status\", \"Sport_id\"").
		Where("\"Sport_id\" = ?", sport.Sport_ID).
		Find(&courtData).Error; err != nil || len(courtData) == 0 { // Fix: Check for empty result
		fmt.Println("No courts found for the sport")
		http.Error(w, "No courts available for the selected sport", http.StatusNotFound)
		return
	}

	var courtIDs []uint
	for _, court := range courtData {
		courtIDs = append(courtIDs, court.CourtID)
	}

	// Fetch time slots
	var courtTimeSlots []DataBase.Court_TimeSlots
	if err := DataBase.DB.
		Where("\"Court_ID\" IN (?)", courtIDs).
		Find(&courtTimeSlots).Error; err != nil {
		fmt.Println("Court TimeSlots not found:", err)
		http.Error(w, "Court TimeSlots not found", http.StatusNotFound)
		return
	}

	// Map Court_ID to time slots
	courtTimeSlotMap := make(map[uint]DataBase.Court_TimeSlots)
	for _, slot := range courtTimeSlots {
		courtTimeSlotMap[slot.Court_ID] = slot
	}

	var courts []DataBase.CourtAvailability
	for _, court := range courtData {
		timeSlot, exists := courtTimeSlotMap[court.CourtID]
		if !exists {
			fmt.Println("No time slots found for Court ID:", court.CourtID)
			continue // Instead of returning 404, continue with other courts
		}

		courtAvailability := DataBase.CourtAvailability{
			CourtID:     court.CourtID,
			CourtName:   court.CourtName,
			CourtStatus: uint(court.CourtStatus),
			SportID:     court.SportID,
			Slots:       []int{timeSlot.Slot_08_09, timeSlot.Slot_09_10, timeSlot.Slot_10_11, timeSlot.Slot_11_12, timeSlot.Slot_12_13, timeSlot.Slot_13_14, timeSlot.Slot_14_15, timeSlot.Slot_15_16, timeSlot.Slot_16_17, timeSlot.Slot_17_18},
		}
		courts = append(courts, courtAvailability)
	}

	// If no courts were found with time slots, return 404
	if len(courts) == 0 {
		http.Error(w, "No courts with available timeslots found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(courts)
	fmt.Println("Court Info Successful for Sport:", sportName)
}
