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

	type bookingRaw struct {
		BookingID     uint   `json:"booking_id"`
		CustomerName  string `json:"customer_name"`
		CustomerEmail string `json:"customer_email"`
		CourtName     string `json:"court_name"`
		SportName     string `json:"sport_name"`
		SlotIndex     int    `json:"slot_index"`
		BookingStatus string `json:"booking_status"`
	}

	var bookingsRaw []bookingRaw

	// Join with Customer, Court, and Sport tables
	err := DataBase.DB.Table("Bookings").
		Select("Bookings.Booking_ID as booking_id, Customer.Name as customer_name, Customer.Email as customer_email, Court.Court_Name as court_name, Sport.Sport_name as sport_name, Bookings.Booking_Time as slot_index, Bookings.Booking_Status as booking_status").
		Joins("JOIN Customer ON Customer.Customer_ID = Bookings.Customer_ID").
		Joins("JOIN Court ON Court.Court_ID = Bookings.Court_ID").
		Joins("JOIN Sport ON Sport.Sport_ID = Bookings.Sport_ID").
		Scan(&bookingsRaw).Error

	if err != nil {
		http.Error(w, "Database error while fetching bookings", http.StatusInternalServerError)
		return
	}

	slots := []string{
		"08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
		"12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
		"16:00 - 17:00", "17:00 - 18:00",
	}

	// Reuse BookingResponse structure but maybe extend it if needed,
	// or just use map/struct here to include Customer info which is important for Admin.
	// Let's create a custom response struct for Admin to include Customer Name/Email.
	type AdminBookingResponse struct {
		Bookings.BookingResponse
		CustomerName  string `json:"customer_name"`
		CustomerEmail string `json:"customer_email"`
	}

	var responseBookings []AdminBookingResponse
	for _, b := range bookingsRaw {
		slotTime := ""
		if b.SlotIndex >= 0 && b.SlotIndex < len(slots) {
			slotTime = slots[b.SlotIndex]
		}

		baseResponse := Bookings.BookingResponse{
			BookingID:     b.BookingID,
			CourtName:     b.CourtName,
			SportName:     b.SportName,
			SlotTime:      slotTime,
			BookingStatus: b.BookingStatus,
		}

		responseBookings = append(responseBookings, AdminBookingResponse{
			BookingResponse: baseResponse,
			CustomerName:    b.CustomerName,
			CustomerEmail:   b.CustomerEmail,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBookings)
}
