package Customer

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
	"strings"
)

// GetCustomer retrieves a customer's profile by email
// @Summary Get customer profile
// @Description Fetch customer details (Name, UFID) by email
// @Tags customers
// @Accept json
// @Produce json
// @Param email query string true "Customer email"
// @Success 200 {object} DataBase.Customer "Customer profile"
// @Failure 404 "Customer not found"
// @Failure 400 "Email required"
// @Router /GetCustomer [get]
func GetCustomer(w http.ResponseWriter, r *http.Request) {
	email := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("email")))
	if email == "" {
		http.Error(w, "Email query parameter is required", http.StatusBadRequest)
		return
	}

	var customer DataBase.Customer
	if err := DataBase.DB.Where("LOWER(\"Email\") = ?", email).First(&customer).Error; err != nil {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customer)
}
