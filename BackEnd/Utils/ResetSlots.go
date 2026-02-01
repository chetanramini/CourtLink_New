package Utils

import (
	"BackEnd/DataBase"
	"encoding/json"
	"log"
	"net/http"
)

// ResetCourtSlots godoc
//
// @Summary      Reset all time‑slots for available courts
// @Description  Sets every slot (08‑18h) back to **available** (value `1`) for every court whose `court_status == 1`.<br>
//   - If **court_name** is supplied, only that court is reset.<br>
//   - If the court (or any available courts) are not found, the call is a no‑op and returns **200** with an
//     informational message.
//
// @Tags         courts
// @Accept       json
// @Produce      json
// @Param        court_name  query     string  false  "Reset a single court by name"  example("Court A")
// @Success      200         {object}  map[string]string  "Slots reset successfully"
// @Failure      500         {object}  DataBase.ErrorResponse  "Database error while updating slots"
// @Router       /resetCourtSlots [put]
func ResetTimeSlotsForAvailableCourts(courtName string) error {
	const (
		AvailableStatus = 1
		SlotAvailable   = 1
	)

	var courtIDs []uint
	db := DataBase.DB.Model(&DataBase.Court{}).Where("\"Court_Status\" = ?", AvailableStatus)

	// If a court name is provided, filter by that name (Case Insensitive)
	if courtName != "" {
		db = db.Where("LOWER(\"Court_Name\") = LOWER(?)", courtName)
	}

	// Get the court IDs that match the condition(s)
	if err := db.Pluck("\"Court_ID\"", &courtIDs).Error; err != nil {
		return err
	}

	if len(courtIDs) == 0 {
		if courtName != "" {
			log.Printf("No available court found with name: %s\n", courtName)
		} else {
			log.Println("No available courts found to reset.")
		}
		return nil
	}

	slotReset := map[string]interface{}{
		"slot_08_09": SlotAvailable, "slot_09_10": SlotAvailable,
		"slot_10_11": SlotAvailable, "slot_11_12": SlotAvailable,
		"slot_12_13": SlotAvailable, "slot_13_14": SlotAvailable,
		"slot_14_15": SlotAvailable, "slot_15_16": SlotAvailable,
		"slot_16_17": SlotAvailable, "slot_17_18": SlotAvailable,
	}

	// Update slots to available
	if err := DataBase.DB.
		Model(&DataBase.Court_TimeSlots{}).
		Where("\"Court_ID\" IN ?", courtIDs).
		Updates(slotReset).Error; err != nil {
		return err
	}

	// Cancel all associated active bookings for these courts
	if err := DataBase.DB.
		Model(&DataBase.Bookings{}).
		Where("\"Court_ID\" IN ? AND \"Booking_Status\" = ?", courtIDs, "Confirmed").
		Update("Booking_Status", "Cancelled by UF CourtLink").Error; err != nil {
		// Log error but don't fail the whole reset? Or fail?
		// For admin reset, we probably want to know.
		log.Printf("Failed to cancel bookings for reset courts: %v\n", err)
		return err
	}

	if courtName != "" {
		log.Printf("Reset time slots for court: %s\n", courtName)
	} else {
		log.Printf("Reset time slots for %d available court(s).\n", len(courtIDs))
	}

	return nil
}
// DeleteAllBookings deletes all bookings from the database
func DeleteAllBookings(w http.ResponseWriter, r *http.Request) {
	if err := DataBase.DB.Exec("TRUNCATE TABLE \"Bookings\" RESTART IDENTITY CASCADE").Error; err != nil {
		http.Error(w, "Failed to delete all bookings", http.StatusInternalServerError)
		return
	}
	// Also reset all slots to 1
	DataBase.DB.Exec("UPDATE \"Court_TimeSlots\" SET slot_08_09=1, slot_09_10=1, slot_10_11=1, slot_11_12=1, slot_12_13=1, slot_13_14=1, slot_14_15=1, slot_15_16=1, slot_16_17=1, slot_17_18=1")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "All bookings deleted and slots reset"})
}

// ResetSystem wipes Customers and Bookings
func ResetSystem(w http.ResponseWriter, r *http.Request) {
	// Truncate Bookings
	if err := DataBase.DB.Exec("TRUNCATE TABLE \"Bookings\" RESTART IDENTITY CASCADE").Error; err != nil {
		log.Printf("Failed to truncate bookings: %v\n", err)
	}
	// Truncate Customers
	if err := DataBase.DB.Exec("TRUNCATE TABLE \"Customer\" RESTART IDENTITY CASCADE").Error; err != nil {
		log.Printf("Failed to truncate customers: %v\n", err)
	}

	// Reset slots
	DataBase.DB.Exec("UPDATE \"Court_TimeSlots\" SET slot_08_09=1, slot_09_10=1, slot_10_11=1, slot_11_12=1, slot_12_13=1, slot_13_14=1, slot_14_15=1, slot_15_16=1, slot_16_17=1, slot_17_18=1")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "System Wiped (Customers & Bookings)"})
}
