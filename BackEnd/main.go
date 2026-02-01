package main

// @title Court Booking API
// @version 1.0
// @description API for managing court bookings
// @host localhost:8080
// @BasePath /

import (
	"BackEnd/Admin"
	"BackEnd/Bookings"
	"BackEnd/Court"
	"BackEnd/Customer"
	"BackEnd/Sport"
	"BackEnd/Utils"
	_ "BackEnd/docs"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/robfig/cron/v3"
	"github.com/rs/cors"
	httpSwagger "github.com/swaggo/http-swagger"
)

var jwks *keyfunc.JWKS

func init() {
	// Initialize JWKS from the Cognito URL provided via env var
	jwksURL := os.Getenv("COGNITO_JWKS_URL")
	if jwksURL == "" {
		fmt.Println("WARNING: COGNITO_JWKS_URL environment variable is not set. Auth will fail.")
		return
	}

	var err error
	// Create the JWKS from the URL.
	options := keyfunc.Options{
		RefreshInterval: time.Hour,
		RefreshRateLimit: time.Minute * 5,
		RefreshErrorHandler: func(err error) {
			log.Printf("There was an error with the JWKS refresh: %v", err)
		},
	}
	jwks, err = keyfunc.Get(jwksURL, options)
	if err != nil {
		log.Fatalf("Failed to create JWKS from resource at the given URL.\nError: %v", err)
	}
	log.Println("JWKS initialized successfully.")
}

func validateToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing token", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse the JWT.
		token, err := jwt.Parse(tokenString, jwks.Keyfunc)

		if err != nil {
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		if !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {

	startScheduler()
	r := mux.NewRouter()

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allow all domains temporarily
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	r.Use(mux.CORSMethodMiddleware(r))

	r.HandleFunc("/getCourts", Court.GetCourt).Methods("GET", "OPTIONS")
	r.HandleFunc("/getCourts", Court.GetCourt).Methods("GET", "OPTIONS")
	r.HandleFunc("/Customer", Customer.CreateCustomer).Methods("POST", "OPTIONS")
	r.HandleFunc("/GetCustomer", Customer.GetCustomer).Methods("GET", "OPTIONS")
	r.HandleFunc("/UpdateCourtSlotandBooking", Court.UpdateCourtSlotandBooking).Methods("PUT", "OPTIONS")
	r.HandleFunc("/CreateBooking", Bookings.CreateBooking).Methods("POST", "OPTIONS")
	r.HandleFunc("/CreateSport", Sport.CreateSport).Methods("POST", "OPTIONS")
	r.HandleFunc("/DeleteSport", Sport.DeleteSport).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/ResetSportCourts", Sport.ResetSportCourts).Methods("POST", "OPTIONS")
	r.HandleFunc("/ResetSportCourts", Sport.ResetSportCourts).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/deleteAllBookings", Utils.DeleteAllBookings).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/admin/resetSystem", Utils.ResetSystem).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/DeleteCourt", Court.DeleteCourt).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/CreateCourt", Court.CreateCourtWithTimeSlots).Methods("POST", "OPTIONS")
	r.HandleFunc("/ListSports", Sport.ListSports).Methods("GET", "OPTIONS")
	r.HandleFunc("/ListCourts", Court.ListCourts).Methods("GET", "OPTIONS")
	r.HandleFunc("/CancelBookingandUpdateSlot", Court.CancelBookingandUpdateSlot).Methods("PUT", "OPTIONS")
	r.HandleFunc("/listBookings", Bookings.ListBookings).Methods("GET", "OPTIONS")
	r.HandleFunc("/cancelBooking", Bookings.CancelBooking).Methods("POST", "OPTIONS")

	r.HandleFunc("/AdminLogin", Admin.AdminLogin).Methods("POST", "OPTIONS")

	r.HandleFunc("/resetCourtSlots", Court.ResetCourtSlotsHandler).Methods("PUT", "OPTIONS")

	r.HandleFunc("/admin/allBookings", Admin.GetAllBookings).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/cancelBooking", Admin.AdminCancelBooking).Methods("POST", "OPTIONS")
	r.HandleFunc("/create-admin", Admin.SeedAdminCreate).Methods("GET", "OPTIONS")

	newroute := r.PathPrefix("/api").Subrouter()
	newroute.Use(validateToken)
	newroute.HandleFunc("/CreateCustomer", Customer.CreateCustomer).Methods("POST", "OPTIONS")

	r.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	handler := corsHandler.Handler(r)

	fmt.Println("Server is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func startScheduler() {
	c := cron.New()
	_, err := c.AddFunc("0 0 * * *", func() {
		log.Println("Resetting court time slots at midnight...")
		if err := Utils.ResetTimeSlotsForAvailableCourts(""); err != nil {
			log.Printf("Error resetting slots: %v", err)
		}
	})
	if err != nil {
		log.Fatalf("Failed to schedule reset job: %v", err)
	}
	c.Start()
}
