import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, Search, CalendarDays, Users, Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatDetail = (d) => (typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => e?.msg).join(" ") : null);

export const MyBookings = ({ open, onClose, onChanged }) => {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await axios.get(`${API}/my-reservations`, { params: { email } });
      setResults(r.data);
    } catch {
      toast.error("Could not look up bookings");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (res) => {
    try {
      await axios.post(`${API}/reservations/${res.id}/cancel`, { email });
      toast.success(`Booking at ${res.villa_name} cancelled`);
      setResults((list) => list.filter((r) => r.id !== res.id));
      onChanged();
    } catch (err) {
      toast.error(formatDetail(err.response?.data?.detail) || "Could not cancel booking");
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" data-testid="my-bookings-modal" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="panel-close" style={{ top: 12, right: 12 }} onClick={onClose} data-testid="my-bookings-close-button">
          <X size={16} />
        </button>
        <div className="section-label">Guest access</div>
        <h2 className="font-display text-2xl text-[#FAF8F5] mt-2">My Bookings</h2>
        <p className="text-sm text-white/50 mt-1 mb-4">Enter the email you booked with to view or cancel your stays.</p>

        <form onSubmit={search} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="you@email.com"
            data-testid="my-bookings-email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="modal-input flex-1"
          />
          <button type="submit" className="modal-btn" data-testid="my-bookings-search-button" disabled={loading}>
            <Search size={14} /> {loading ? "…" : "Find"}
          </button>
        </form>

        {results && (
          <div className="mt-5 flex flex-col gap-3 max-h-[45vh] overflow-y-auto panel-scroll pr-1" data-testid="my-bookings-results">
            {results.length === 0 && (
              <div className="text-sm text-white/40 text-center py-6" data-testid="my-bookings-empty">
                No bookings found for this email.
              </div>
            )}
            {results.map((r) => (
              <div key={r.id} className="booking-row" data-testid={`my-booking-row-${r.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-[#FAF8F5] font-medium truncate">{r.villa_name}</div>
                  <div className="flex items-center gap-3 text-xs text-white/50 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays size={11} />{r.check_in} → {r.check_out}</span>
                    <span className="flex items-center gap-1"><Users size={11} />{r.guests}</span>
                    <span className="text-[#D4A359] font-semibold">${r.total_price.toLocaleString()}</span>
                  </div>
                </div>
                <button className="cancel-booking-btn" data-testid={`my-bookings-cancel-${r.id}`} onClick={() => cancel(r)}>
                  <Trash2 size={12} /> Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
