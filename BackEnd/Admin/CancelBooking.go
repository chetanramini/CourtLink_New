package Admin

import (
	"BackEnd/DataBase"
	"encoding/json"
	"fmt"
	"net/http"
)

type AdminCancelRequest struct {
	BookingID uint `json:"booking_id"`
}

// AdminCancelBooking cancels a booking by ID (Admin Override).
// @Summary Cancel a booking (Admin)
// @Description Allows admins to cancel any booking by ID, freeing up the slot.
// @Tags admin
// @Accept json
// @Produce json
// @Param  booking body AdminCancelRequest true "Cancel Request"
// @Success 200 {object} map[string]interface{} "Cancellation successful"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 404 {object} map[string]string "Booking not found"
// @Router /admin/cancelBooking [post]
func AdminCancelBooking(w http.ResponseWriter, r *http.Request) {
	var req AdminCancelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
		return
	}

	// 1. Get Booking
	var booking DataBase.Bookings
	if err := DataBase.DB.First(&booking, req.BookingID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"message": "Booking not found"})
		return
	}

	// 2. Identify Slot Column
	slotColumns := []string{
		"slot_08_09", "slot_09_10", "slot_10_11", "slot_11_12", "slot_12_13",
		"slot_13_14", "slot_14_15", "slot_15_16", "slot_16_17", "slot_17_18",
	}
	if booking.Booking_Time < 0 || booking.Booking_Time >= len(slotColumns) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid booking time index in record"})
		return
	}
	columnName := slotColumns[booking.Booking_Time]

	// 3. Start Transaction
	tx := DataBase.DB.Begin()

	// 3a. Delete Booking
	if err := tx.Delete(&booking).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to delete booking"})
		return
	}

	// 3b. Update Court_TimeSlots (Set to 1 - Available)
	// Note: We need to use "Court_ID" (quoted) for case sensitive postgres
	updateQuery := fmt.Sprintf("UPDATE \"Court_TimeSlots\" SET \"%s\" = 1 WHERE \"Court_ID\" = ?", columnName)
	if err := tx.Exec(updateQuery, booking.Court_ID).Error; err != nil {
		tx.Rollback()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to update court availability"})
		return
	}

	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Cancellation successful (Admin Override)",
	})
}
