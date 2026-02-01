package Bookings

import (
	"BackEnd/DataBase"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type CancelBookingRequest struct {
	BookingID uint   `json:"booking_id"`
	Email     string `json:"email"`
}

// CancelBooking cancels a booking and frees up the slot.
// @Summary Cancel a booking
// @Description Verified ownership by email, deletes booking, and resets slot to available.
// @Tags bookings
// @Accept json
// @Produce json
// @Param  booking body CancelBookingRequest true "Cancel Request"
// @Success 200 {object} map[string]interface{} "Cancellation successful"
// @Failure 400 {object} DataBase.ErrorResponse "Invalid request"
// @Failure 403 {object} DataBase.ErrorResponse "Unauthorized"
// @Failure 404 {object} DataBase.ErrorResponse "Booking not found"
// @Router /CancelBooking [post]
func CancelBooking(w http.ResponseWriter, r *http.Request) {
	var req CancelBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Get Booking and Customer Validation
	var booking DataBase.Bookings
	if err := DataBase.DB.First(&booking, req.BookingID).Error; err != nil {
		http.Error(w, "Booking not found", http.StatusNotFound)
		return
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(req.Email))
	var customer DataBase.Customer
	if err := DataBase.DB.Where("LOWER(\"Email\") = ?", normalizedEmail).First(&customer).Error; err != nil {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	if booking.Customer_ID != customer.Customer_ID {
		http.Error(w, "Unauthorized to cancel this booking", http.StatusForbidden)
		return
	}

	// 2. Identify Slot Column
	slotColumns := []string{
		"slot_08_09", "slot_09_10", "slot_10_11", "slot_11_12", "slot_12_13",
		"slot_13_14", "slot_14_15", "slot_15_16", "slot_16_17", "slot_17_18",
	}
	if booking.Booking_Time < 0 || booking.Booking_Time >= len(slotColumns) {
		// Should not happen if data integrity is maintaned
		http.Error(w, "Invalid booking time index in record", http.StatusInternalServerError)
		return
	}
	columnName := slotColumns[booking.Booking_Time]

	// 3. Start Transaction
	tx := DataBase.DB.Begin()

	// 3a. Update Booking Status to "Cancelled" (Soft Cancel)
	// We do NOT delete so that history is preserved for Admin/User
	if err := tx.Model(&booking).Update("Booking_Status", "Cancelled").Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to cancel booking", http.StatusInternalServerError)
		return
	}

	// 3b. Update Court_TimeSlots (Set to 1 - Available)
	updateQuery := fmt.Sprintf("UPDATE \"Court_TimeSlots\" SET \"%s\" = 1 WHERE \"Court_ID\" = ?", columnName)
	if err := tx.Exec(updateQuery, booking.Court_ID).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to update court availability", http.StatusInternalServerError)
		return
	}

	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Cancellation successful",
	})
}
