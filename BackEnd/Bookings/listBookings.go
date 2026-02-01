package Bookings

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

type BookingResponse struct {
	BookingID     uint   `json:"booking_id"`
	CourtName     string `json:"court_name"`
	SportName     string `json:"sport_name"`
	SlotTime      string `json:"slot_time"`
	BookingStatus string `json:"booking_status"`
}

// ListBookings godoc
// @Summary      List bookings for a customer
// @Description  Retrieves a list of bookings for a customer by email. Returns booking details including court name, sport name, slot time, and booking status.
// @Tags         bookings
// @Accept       json
// @Produce      json
// @Param        email  query     string  true  "Customer email"  default(john@example.com)
// @Success      200    {array}   BookingResponse  "List of bookings for the customer"  example([{"booking_id":1,"court_name":"Court A","sport_name":"Tennis","slot_time":"10-11 AM","booking_status":"Confirmed"}])
// @Failure      400    {string}  string  "Email query parameter is required"
// @Failure      404    {string}  string  "Customer not found"
// @Failure      500    {string}  string  "Database error while fetching bookings"
// @Router       /listBookings [get]
func ListBookings(w http.ResponseWriter, r *http.Request) {

	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Email query parameter is required", http.StatusBadRequest)
		return
	}

	// 1. Find Customer
	var customer DataBase.Customer
	if err := DataBase.DB.Where("\"Email\" = ?", email).First(&customer).Error; err != nil {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	// 2. Find Bookings with Associations
	var bookings []DataBase.Bookings
	if err := DataBase.DB.Preload("Court").Preload("Sport").Where("\"Customer_ID\" = ?", customer.Customer_ID).Find(&bookings).Error; err != nil {
		http.Error(w, "Database error while fetching bookings", http.StatusInternalServerError)
		return
	}

	slots := []string{
		"08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
		"12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
		"16:00 - 17:00", "17:00 - 18:00",
	}

	var responseBookings []BookingResponse
	for _, b := range bookings {
		slotTime := ""
		if b.Booking_Time >= 0 && b.Booking_Time < len(slots) {
			slotTime = slots[b.Booking_Time]
		}
		responseBookings = append(responseBookings, BookingResponse{
			BookingID:     b.Booking_ID,
			CourtName:     b.Court.Court_Name,
			SportName:     b.Sport.Sport_name,
			SlotTime:      slotTime,
			BookingStatus: b.Booking_Status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBookings)
}
