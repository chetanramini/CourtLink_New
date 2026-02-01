package Admin

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginAdmin handles admin login requests.
// @Summary Admin login
// @Description Validates admin credentials (plain text match)
// @Tags admins
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "Admin credentials"
// @Success 200 {object} map[string]string "Login successful"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 400 {object} map[string]string "Invalid request body"
// @Router /AdminLogin [post]
func AdminLogin(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var admin DataBase.Admin
	// GORM raw query or quoted Where clause is needed for Case Sensitive columns in Postgres
	result := DataBase.DB.Where("\"Username\" = ? AND \"Password\" = ?", loginReq.Username, loginReq.Password).First(&admin)
	if result.Error != nil || result.RowsAffected == 0 {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
	})
}
