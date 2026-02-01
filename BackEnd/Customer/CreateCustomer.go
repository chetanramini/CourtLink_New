package Customer

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
	"strings"
)

// CreateCustomer handles customer creation and profile updates (Upsert).
// @Summary Create or Update a customer
// @Description Adds a new customer or updates an existing one (specifically for UFID/Name).
// @Tags customers
// @Accept json
// @Produce json
// @Param customer body DataBase.Customer true "Customer data"
// @Success 200 {object} map[string]interface{} "Customer record updated/added successfully"
// @Failure 400 "Invalid request body"
// @Failure 500 "Internal server error"
// @Router /Customer [post]
func CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var c DataBase.Customer
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// Normalize email
	c.Email = strings.ToLower(strings.TrimSpace(c.Email))

	var existingCustomer DataBase.Customer
	// Check if customer exists by Email (Case Insensitive just to be safe, but we lowercased input)
	result := DataBase.DB.Where("LOWER(\"Email\") = ?", c.Email).First(&existingCustomer)

	if result.RowsAffected > 0 {
		// Update existing customer info (UFID/Name)
		// We use map to ensure zero values (if any) are respected if intended, but here we want to overwrite
		updates := map[string]interface{}{}

		// Force update if provided
		if c.UFID != "" {
			updates["UFID"] = c.UFID
		}
		if c.Name != "" {
			updates["Name"] = c.Name
		}

		if len(updates) > 0 {
			if err := DataBase.DB.Model(&existingCustomer).Updates(updates).Error; err != nil {
				http.Error(w, "Failed to update customer profile", http.StatusInternalServerError)
				return
			}
		}

		// Return the *updated* customer object to confirm changes to frontend
		// Need to reload to be sure
		DataBase.DB.First(&existingCustomer, existingCustomer.Customer_ID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":  "Customer profile updated",
			"customer": existingCustomer,
		})
		return
	}

	// Create new customer
	if err := DataBase.DB.Create(&c).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	response := map[string]interface{}{
		"message":  "Customer record added successfully",
		"customer": c,
	}
	json.NewEncoder(w).Encode(response)
}
