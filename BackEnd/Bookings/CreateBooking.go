package Bookings

import (
	"BackEnd/DataBase"
	"encoding/json"
	"fmt"
	"net/http"
)

type BookingRequest struct {
	CourtID   uint   `json:"court_id"`
	SportID   uint   `json:"sport_id"`
	Email     string `json:"email"`
	SlotIndex int    `json:"slot_index"` // 0 for 08-09, 1 for 09-10, etc.
}

// CreateBooking creates a new booking after validating customer, sport, and court.
// @Summary Create a new booking
// @Description Creates a new booking, updates court slot availability, and records the booking.
// @Tags bookings
// @Accept json
// @Produce json
// @Param  booking body BookingRequest true "Booking Request"
// @Success 201 {object} map[string]interface{} "Booking successful"
// @Failure 400 {object} DataBase.ErrorResponse "Invalid request"
// @Failure 404 {object} DataBase.ErrorResponse "Resource not found"
// @Failure 500 {object} DataBase.ErrorResponse "Internal server error"
// @Router /CreateBooking [post]
func CreateBooking(w http.ResponseWriter, r *http.Request) {
	var req BookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Look up Customer by Email, Create if not exists
	var customer DataBase.Customer
	if err := DataBase.DB.Where("\"Email\" = ?", req.Email).First(&customer).Error; err != nil {
		// Auto-create customer
		customer = DataBase.Customer{
			Email: req.Email,
			Name:  "Gator User", // Default name, can be updated later
		}
		if createErr := DataBase.DB.Create(&customer).Error; createErr != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Failed to create customer profile"})
			return
		}
	}

	// 2. Validate Sport and Court
	var sport DataBase.Sport
	if err := DataBase.DB.First(&sport, req.SportID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Sport not found"})
		return
	}
	var court DataBase.Court
	if err := DataBase.DB.First(&court, req.CourtID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Court not found"})
		return
	}

	// 3. Map Slot Index to Column Name and Time String
	slotColumns := []string{
		"slot_08_09", "slot_09_10", "slot_10_11", "slot_11_12", "slot_12_13",
		"slot_13_14", "slot_14_15", "slot_15_16", "slot_16_17", "slot_17_18",
	}

	if req.SlotIndex < 0 || req.SlotIndex >= len(slotColumns) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Invalid slot index"})
		return
	}
	columnName := slotColumns[req.SlotIndex]

	// 4. Check if Slot is Available (Status 1)
	var count int64
	checkQuery := fmt.Sprintf("SELECT count(*) FROM \"Court_TimeSlots\" WHERE \"Court_ID\" = ? AND \"%s\" = 1", columnName)
	if err := DataBase.DB.Raw(checkQuery, req.CourtID).Count(&count).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Database error checking availability"})
		return
	}

	if count == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict) // 409 Conflict
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Slot is already booked or unavailable"})
		return
	}

	// 5. Start Transaction
	tx := DataBase.DB.Begin()

	// 5a. Create Booking Record
	booking := DataBase.Bookings{
		Customer_ID:    customer.Customer_ID,
		Sport_ID:       req.SportID,
		Court_ID:       req.CourtID,
		Booking_Status: "Confirmed",
		Booking_Time:   req.SlotIndex,
	}

	if err := tx.Create(&booking).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Failed to create booking"})
		return
	}

	// 5b. Update Court_TimeSlots (Set to 2 - Booked)
	updateQuery := fmt.Sprintf("UPDATE \"Court_TimeSlots\" SET \"%s\" = 2 WHERE \"Court_ID\" = ?", columnName)
	if err := tx.Exec(updateQuery, req.CourtID).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DataBase.ErrorResponse{Message: "Failed to update court availability"})
		return
	}

	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Booking successful",
		"booking_id": booking.Booking_ID,
		"court":      court.Court_Name,
		"slot":       req.SlotIndex,
	})
}
