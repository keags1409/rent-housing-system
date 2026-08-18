import { Calendar, MapIcon, TableProperties, Leaf } from "lucide-react";

export const NavBar = ({ view, setView, dates, setDates, bookingsCount }) => {
  return (
    <header className="nav-glass fixed top-0 left-0 right-0 z-40 px-5 sm:px-8 py-3 flex items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-2.5 mr-auto" data-testid="brand-logo">
        <span className="brand-badge"><Leaf size={15} strokeWidth={2.2} /></span>
        <div className="leading-none">
          <span className="font-display text-lg sm:text-xl tracking-[0.18em] text-[#FAF8F5]">AURA</span>
          <span className="hidden sm:block text-[9px] font-mono tracking-[0.3em] uppercase text-[#D4A359] mt-0.5">Forest Lake Resort</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 date-pill" data-testid="nav-date-selector-button">
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
          <TableProperties size={13} /> <span className="hidden sm:inline">Reservations</span>
          {bookingsCount > 0 && <span className="count-chip" data-testid="nav-bookings-count">{bookingsCount}</span>}
        </button>
      </div>
    </header>
  );
};
