package DataBase

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ErrorResponse struct {
	Message string `json:"message"`
}

type SportSelection struct {
	Sport string `json:"sport"`
}

type CancelRequest struct {
	Booking_ID uint `json:"Booking_ID"`
}

type CourtUpdate struct {
	Court_Name     string `json:"Court_Name"`
	Court_ID       uint   `json:"Court_ID"`
	Slot_Index     int    `json:"Slot_Index"`
	Customer_email string `json:"Customer_email"`
	Sport_name     string `json:"Sport_name"`
	Sport_ID       string `json:"Sport_ID"`
}

type CourtAvailability struct {
	CourtName   string `json:"CourtName"`
	CourtStatus uint   `json:"CourtStatus"`
	CourtID     uint   `json:"CourtID"`
	Slots       []int  `json:"Slots"`
}

type Customer struct {
	Customer_ID uint   `gorm:"column:Customer_ID;primaryKey;autoIncrement" json:"Customer_ID"`
	Name        string `gorm:"column:Name" json:"name"`
	Contact     string `gorm:"column:Contact" json:"Contact"`
	Email       string `gorm:"column:Email" json:"email"`
}

type Sport struct {
	Sport_ID          uint   `gorm:"column:Sport_ID;primaryKey;autoIncrement;unique;not null" json:"Sport_ID"`
	Sport_name        string `gorm:"column:Sport_name;unique;not null" json:"Sport_name"`
	Sport_Description string
}

type Court struct {
	Court_ID       uint   `gorm:"column:Court_ID;primaryKey;autoIncrement" json:"Court_ID"`
	Court_Name     string `gorm:"column:Court_Name;unique;not null" json:"Court_Name"`
	Court_Location string `gorm:"column:Court_Location;not null" json:"Court_Location"`
	Court_Capacity *int
	Court_Status   int    `gorm:"column:Court_Status;not null" json:"Court_Status"`
	Sport_id       uint   `gorm:"column:Sport_id;index;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"Sport_id"`
	Sport          *Sport `gorm:"foreignKey:Sport_ID; references:Sport_id"`
}

type Court_TimeSlots struct {
	ID         uint   `gorm:"column:ID;primaryKey;autoIncrement" json:"ID"`
	Court_ID   uint   `gorm:"column:Court_ID;not null;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"Court_ID"`
	Slot_08_09 int    `gorm:"column:slot_08_09;not null;default:1" json:"slot_08_09"`
	Slot_09_10 int    `gorm:"column:slot_09_10;not null;default:1" json:"slot_09_10"`
	Slot_10_11 int    `gorm:"column:slot_10_11;not null;default:1" json:"slot_10_11"`
	Slot_11_12 int    `gorm:"column:slot_11_12;not null;default:1" json:"slot_11_12"`
	Slot_12_13 int    `gorm:"column:slot_12_13;not null;default:1" json:"slot_12_13"`
	Slot_13_14 int    `gorm:"column:slot_13_14;not null;default:1" json:"slot_13_14"`
	Slot_14_15 int    `gorm:"column:slot_14_15;not null;default:1" json:"slot_14_15"`
	Slot_15_16 int    `gorm:"column:slot_15_16;not null;default:1" json:"slot_15_16"`
	Slot_16_17 int    `gorm:"column:slot_16_17;not null;default:1" json:"slot_16_17"`
	Slot_17_18 int    `gorm:"column:slot_17_18;not null;default:1" json:"slot_17_18"`
	Court_Name string `gorm:"column:Court_Name;unique;not null;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"Court_Name"`
	Court      *Court `gorm:"foreignKey:Court_Name; references:Court_Name"`
	CourtIDRef *Court `gorm:"foreignKey:Court_ID; references:Court_ID"`
}
type Bookings struct {
	Booking_ID     uint   `gorm:"column:Booking_ID;primaryKey;autoIncrement" json:"Booking_ID"`
	Customer_ID    uint   `gorm:"column:Customer_ID;index;not null" json:"Customer_ID"`
	Sport_ID       uint   `gorm:"column:Sport_ID;index;not null" json:"Sport_ID"`
	Court_ID       uint   `gorm:"column:Court_ID;index;not null" json:"Court_ID"`
	Booking_Status string `gorm:"column:Booking_Status;not null" json:"Booking_Status"`
	Booking_Time   int    `gorm:"column:Booking_Time;not null" json:"Booking_Time"`

	Customer Customer `gorm:"foreignKey:Customer_ID;references:Customer_ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Sport    Sport    `gorm:"foreignKey:Sport_ID;references:Sport_ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Court    Court    `gorm:"foreignKey:Court_ID;references:Court_ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

type Admin struct {
	Admin_ID uint   `gorm:"column:Admin_ID;primaryKey;autoIncrement" json:"Admin_ID"`
	Username string `gorm:"column:Username;unique;not null" json:"Username"`
	Password string `gorm:"column:Password;not null" json:"Password"`
}

var DB *gorm.DB

func (Customer) TableName() string {
	return "Customer"
}

func (Sport) TableName() string {
	return "Sport"
}

func (Court) TableName() string {
	return "Court"
}

func (Court_TimeSlots) TableName() string {
	return "Court_TimeSlots"
}

func (Bookings) TableName() string {
	return "Bookings"
}

func (Admin) TableName() string {
	return "Admin"
}

func init() {
	var err error
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Fallback for local development or when env var is missing
		// Warning: Defaults to localhost postgres. Ensure a local postgres is running or set DATABASE_URL.
		dsn = "host=localhost user=postgres password=postgres dbname=courtlink port=5432 sslmode=disable"
		fmt.Println("DATABASE_URL not set, using default: ", dsn)
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
	} else {
		fmt.Println("Successfully connected to the database")

		// Migrate independent tables first
		if err := DB.AutoMigrate(&Customer{}, &Sport{}); err != nil {
			fmt.Printf("Failed to migrate Customer/Sport: %v\n", err)
		}

		// Migrate Court (depends on Sport?) - check struct
		// Court struct has 'Sport_id' and 'Sport *Sport'.
		if err := DB.AutoMigrate(&Court{}); err != nil {
			fmt.Printf("Failed to migrate Court: %v\n", err)
		}

		// Migrate dependent tables
		if err := DB.AutoMigrate(&Court_TimeSlots{}, &Admin{}, &Bookings{}); err != nil {
			fmt.Printf("Failed to migrate dependent tables: %v\n", err)
		}
	}
}
