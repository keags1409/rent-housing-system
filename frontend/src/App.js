import { useState, useEffect, useCallback, useMemo } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster } from "sonner";
import { NavBar } from "@/components/NavBar";
import { ReservationPanel } from "@/components/ReservationPanel";
import { AdminView } from "@/components/AdminView";
import { ResortScene } from "@/three/Scene";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const iso = (d) => d.toISOString().slice(0, 10);
const defaultDates = () => {
  const a = new Date(); a.setDate(a.getDate() + 7);
  const b = new Date(); b.setDate(b.getDate() + 10);
  return { checkIn: iso(a), checkOut: iso(b) };
};

export default function App() {
  const [villas, setVillas] = useState([]);
  const [dates, setDates] = useState(defaultDates);
  const [bookedIds, setBookedIds] = useState(new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("map");
  const [bookingsCount, setBookingsCount] = useState(0);

  useEffect(() => {
    axios.get(`${API}/villas`).then((r) => setVillas(r.data)).catch(console.error);
  }, []);

  const refreshAvailability = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([
        axios.get(`${API}/availability`, { params: { check_in: dates.checkIn, check_out: dates.checkOut } }),
        axios.get(`${API}/stats`),
      ]);
      setBookedIds(new Set(a.data.booked_villa_ids));
      setBookingsCount(s.data.total_bookings);
    } catch (e) {
      console.error(e);
    }
  }, [dates]);

  useEffect(() => { refreshAvailability(); }, [refreshAvailability]);

  const selectedVilla = useMemo(() => villas.find((v) => v.id === selectedId) || null, [villas, selectedId]);

  return (
    <div className="app-shell">
      <NavBar view={view} setView={(v) => { setView(v); if (v === "admin") setSelectedId(null); }} dates={dates} setDates={setDates} bookingsCount={bookingsCount} />

      {villas.length > 0 && (
        <ResortScene
          villas={villas}
          bookedIds={bookedIds}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={setSelectedId}
        />
      )}

      {view === "map" && !selectedId && (
        <div className="hero-caption" data-testid="hero-caption">
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#164E3D]">Interactive resort map</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#16201B] leading-tight mt-2">
            Choose your villa<br />from the sky.
          </h1>
          <p className="text-sm text-[#5C6B62] mt-3 max-w-xs leading-relaxed">
            Hover any home to preview it. Click to fly in and reserve your dates.
          </p>
        </div>
      )}

      {selectedId && view === "map" && (
        <button className="back-orbit-btn" data-testid="reset-camera-button" onClick={() => setSelectedId(null)}>
          ← Back to resort view
        </button>
      )}

      <ReservationPanel
        villa={view === "map" ? selectedVilla : null}
        booked={selectedId ? bookedIds.has(selectedId) : false}
        dates={dates}
        onClose={() => setSelectedId(null)}
        onBooked={refreshAvailability}
      />

      {view === "admin" && <AdminView onChange={refreshAvailability} />}

      <Toaster position="bottom-left" richColors theme="dark" />
    </div>
  );
}
