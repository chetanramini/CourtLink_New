package Court

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

// CourtCreationResponse represents the structure of the response for creating a court
type CourtCreationResponse struct {
	Message string         `json:"message"`
	Court   DataBase.Court `json:"court"`
}

// CourtRequest represents the structure of the request body for creating a court
type CourtRequest struct {
	Court_Name     string `json:"Court_Name"`
	Court_Location string `json:"Court_Location"`
	Court_Capacity *int   `json:"Court_Capacity"`
	Court_Status   int    `json:"Court_Status"`
	Sport_name     string `json:"Sport_name"`
}

// CreateCourtWithTimeSlots godoc
// @Summary Create a new court with associated time slots
// @Description Creates a new court and assigns time slots for bookings
// @Tags courts
// @Accept json
// @Produce json
// @Param court body DataBase.Court true "Court data"
// @Success 201 {object} CourtCreationResponse "Court created successfully"
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 500 {object} map[string]string "Failed to create court"
// @Router /CreateCourt [post]
func CreateCourtWithTimeSlots(w http.ResponseWriter, r *http.Request) {
	var c DataBase.Court
	var requestData CourtRequest

	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var sport DataBase.Sport
	err = DataBase.DB.Where("\"Sport_name\" = ?", requestData.Sport_name).First(&sport).Error
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"message": "Sport not found"})
		return
	}

	c.Court_Name = requestData.Court_Name
	c.Court_Location = requestData.Court_Location
	c.Court_Capacity = requestData.Court_Capacity
	c.Sport_id = sport.Sport_ID

	if requestData.Court_Status == 0 {
		c.Court_Status = 1
	} else {
		c.Court_Status = requestData.Court_Status
	}

	var existingCourt DataBase.Court
	result := DataBase.DB.Where("Court_Name = ?", c.Court_Name).First(&existingCourt)
	if result.RowsAffected > 0 {
		http.Error(w, "The court record already exists", http.StatusBadRequest)
		return
	}

	if err := DataBase.DB.Create(&c).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	courtTimeSlots := DataBase.Court_TimeSlots{
		Court_ID:   c.Court_ID,
		Slot_08_09: 1,
		Slot_09_10: 1,
		Slot_10_11: 1,
		Slot_11_12: 1,
		Slot_12_13: 1,
		Slot_13_14: 1,
		Slot_14_15: 1,
		Slot_15_16: 1,
		Slot_16_17: 1,
		Slot_17_18: 1,
		Court_Name: c.Court_Name,
	}

	if err := DataBase.DB.Create(&courtTimeSlots).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Send the response with the correct structure
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	response := CourtCreationResponse{
		Message: "Court record and TimeSlots added successfully!!",
		Court:   c,
	}
	json.NewEncoder(w).Encode(response)
}
