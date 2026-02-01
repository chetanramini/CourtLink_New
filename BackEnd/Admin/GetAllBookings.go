package Admin

import (
	"BackEnd/Bookings"
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

// GetAllBookings retrieves all bookings in the system with full details
// @Summary List all bookings (Admin)
// @Description Retrieves a list of all bookings including customer, court, and sport details.
// @Tags admin
// @Accept json
// @Produce json
// @Success 200 {array} Bookings.BookingResponse "List of all bookings"
// @Failure 500 {string} string "Database error"
// @Router /admin/allBookings [get]
func GetAllBookings(w http.ResponseWriter, r *http.Request) {

	var bookings []DataBase.Bookings
	// Use Preload to fetch relationships safely
	// Filtering: Exclude any booking that is "Cancelled" or "Cancelled by UF CourtLink"
	if err := DataBase.DB.
		Where("\"Booking_Status\" NOT LIKE ?", "Cancelled%").
		Preload("Customer").
		Preload("Court").
		Preload("Sport").
		Find(&bookings).Error; err != nil {
		http.Error(w, "Database error while fetching bookings", http.StatusInternalServerError)
		return
	}

	slots := []string{
		"08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
		"12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
		"16:00 - 17:00", "17:00 - 18:00",
	}

	type AdminBookingResponse struct {
		Bookings.BookingResponse
		CustomerName  string `json:"customer_name"`
		CustomerUFID  string `json:"customer_ufid"`
		CustomerEmail string `json:"customer_email"`
	}

	var responseBookings []AdminBookingResponse
	for _, b := range bookings {
		slotTime := ""
		if b.Booking_Time >= 0 && b.Booking_Time < len(slots) {
			slotTime = slots[b.Booking_Time]
		}

		baseResponse := Bookings.BookingResponse{
			BookingID:     b.Booking_ID,
			CourtName:     b.Court.Court_Name,
			SportName:     b.Sport.Sport_name,
			SlotTime:      slotTime,
			BookingStatus: b.Booking_Status,
		}

		responseBookings = append(responseBookings, AdminBookingResponse{
			BookingResponse: baseResponse,
			CustomerName:    b.Customer.Name,
			CustomerUFID:    b.Customer.UFID,
			CustomerEmail:   b.Customer.Email,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBookings)
}
