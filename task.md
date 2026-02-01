# CourtLink Refinement Tasks

## Completed (Session & Profile)
- [x] **System Wipe**: Implemented `ResetSystem` to clear Customers & Bookings.
- [x] **Registration**: Updated Sign Up to capture Name/UFID and create DB profile immediately.
- [x] **Strict Login**: Added logic to detect "Zombie" accounts (Cognito exists, DB missing) and guide them to restoration.
- [x] **Profile Restoration**: Updated `CompleteProfileDialog` to allow existing users to re-create their profile after wipe.
- [x] **Navbar Sync**: Fixed top navbar to fetch latest profile data from backend on mount.

## Completed (Bookings)
- [x] **Cancellation Visibility**: 
    - Admin Portal: Hides "Cancelled" bookings.
    - User Profile: Shows "Cancelled by UF CourtLink" for admin resets.

## Active / To Investigate
- [ ] **Admin Booking Visibility**: User reported "Cancelled" bookings still showing in Admin view (needs verification/refresh).
- [ ] (Add new bugs here...)
