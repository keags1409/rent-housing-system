import { Calendar, MapIcon, Lock, Leaf, Ticket } from "lucide-react";

export const NavBar = ({ view, setView, dates, setDates, bookingsCount, onOpenMyBookings }) => {
  return (
    <header className="nav-glass fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-2.5 md:py-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
      <div className="flex items-center gap-2.5 mr-auto" data-testid="brand-logo">
        <span className="brand-badge"><Leaf size={15} strokeWidth={2.2} /></span>
        <div className="leading-none">
          <span className="font-display text-lg sm:text-xl tracking-[0.18em] text-[#FAF8F5]">AURA</span>
          <span className="hidden sm:block text-[9px] font-mono tracking-[0.3em] uppercase text-[#D4A359] mt-0.5">Forest Lake Resort</span>
        </div>
      </div>

      <button
        data-testid="nav-my-bookings-button"
        onClick={onOpenMyBookings}
        className="toggle-btn my-bookings-btn"
      >
        <Ticket size={13} /> <span className="hidden sm:inline">My Bookings</span>
      </button>

      <div className="flex items-center gap-1 view-toggle">
        <button
          data-testid="nav-map-view-toggle"
          onClick={() => setView("map")}
          className={`toggle-btn ${view === "map" ? "toggle-active" : ""}`}
        >
          <MapIcon size={13} /> <span className="hidden sm:inline">3D Map</span>
        </button>
        <button
          data-testid="nav-admin-view-toggle"
          onClick={() => setView("admin")}
          className={`toggle-btn ${view === "admin" ? "toggle-active" : ""}`}
        >
          <Lock size={12} /> <span className="hidden sm:inline">Owner</span>
          {bookingsCount > 0 && <span className="count-chip" data-testid="nav-bookings-count">{bookingsCount}</span>}
        </button>
      </div>

      <div className="flex order-last w-full md:w-auto md:order-none items-center justify-center gap-2 date-pill" data-testid="nav-date-selector-button">
        <Calendar size={14} className="text-[#D4A359]" />
        <label className="date-field">
          <span>Check-in</span>
          <input
            type="date"
            data-testid="nav-checkin-input"
            value={dates.checkIn}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDates((d) => ({ ...d, checkIn: e.target.value }))}
          />
        </label>
        <span className="text-white/25">—</span>
        <label className="date-field">
          <span>Check-out</span>
          <input
            type="date"
            data-testid="nav-checkout-input"
            value={dates.checkOut}
            min={dates.checkIn}
            onChange={(e) => setDates((d) => ({ ...d, checkOut: e.target.value }))}
          />
        </label>
      </div>
    </header>
  );
};
