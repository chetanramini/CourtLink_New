package Admin

import (
	"BackEnd/DataBase"
	"encoding/json"
	"net/http"
)

// SeedAdminCreate creates a default admin user if one doesn't exist
// @Summary Seed default admin
// @Description Creates an admin user with username 'admin' and password 'admin123'
// @Tags admin
// @Success 200 {string} string "Admin created"
// @Router /create-admin [get]
func SeedAdminCreate(w http.ResponseWriter, r *http.Request) {
	username := "admin"
	password := "admin123"

	var existingAdmin DataBase.Admin
	if err := DataBase.DB.Where("\"Username\" = ?", username).First(&existingAdmin).Error; err == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Admin user 'admin' already exists"})
		return
	}

	newAdmin := DataBase.Admin{
		Username: username,
		Password: password, // In a real app, hash this!
	}

	if err := DataBase.DB.Create(&newAdmin).Error; err != nil {
		http.Error(w, "Failed to create admin: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Created admin user: admin / admin123"})
}
