import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight, BedDouble, Bath, Users, Ruler, Star, Check, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RESORT_FEE = 75;

export const ReservationPanel = ({ villa, booked, dates, onClose, onBooked }) => {
  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", guests: 2, requests: "" });
  const [localDates, setLocalDates] = useState(dates);
  const [submitting, setSubmitting] = useState(false);
  const open = !!villa;

  useEffect(() => { setSlide(0); }, [villa?.id]);
  useEffect(() => { setLocalDates(dates); }, [dates, villa?.id]);

  const nights = useMemo(() => {
    const a = new Date(localDates.checkIn), b = new Date(localDates.checkOut);
    return Math.max(0, Math.round((b - a) / 86400000));
  }, [localDates]);

  const submit = async (e) => {
    e.preventDefault();
    if (!villa || nights < 1) { toast.error("Select valid dates — at least one night."); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/reservations`, {
        villa_id: villa.id,
        guest_name: form.name,
        guest_email: form.email,
        check_in: localDates.checkIn,
        check_out: localDates.checkOut,
        guests: Number(form.guests),
        special_requests: form.requests || null,
      });
      toast.success(`${villa.name} reserved`, {
        description: `${res.data.nights} nights · $${res.data.total_price.toLocaleString()} · confirmation email prepared for ${form.email}`,
      });
      setForm({ name: "", email: "", guests: 2, requests: "" });
      onBooked();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reservation failed. Try different dates.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside
      data-testid="reservation-panel-drawer"
      className={`panel-drawer ${open ? "panel-open" : ""}`}
      aria-hidden={!open}
    >
      {villa && (
        <div className="h-full flex flex-col overflow-y-auto panel-scroll">
          <div className="relative">
            <img src={villa.images[slide]} alt={villa.name} className="w-full h-60 sm:h-72 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C2E24]/90 via-transparent to-[#0C2E24]/30 pointer-events-none" />
            <button data-testid="close-reservation-panel-button" onClick={onClose} className="panel-close">
              <X size={16} />
            </button>
            <button data-testid="slider-prev-button" onClick={() => setSlide((s) => (s - 1 + villa.images.length) % villa.images.length)} className="slider-arrow left-3"><ChevronLeft size={16} /></button>
            <button data-testid="slider-next-button" onClick={() => setSlide((s) => (s + 1) % villa.images.length)} className="slider-arrow right-3"><ChevronRight size={16} /></button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {villa.images.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} className={`slider-dot ${i === slide ? "dot-active" : ""}`} />
              ))}
            </div>
            <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
              <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#D4A359] mb-1">{villa.tag}</div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#FAF8F5] leading-tight">{villa.name}</h2>
            </div>
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="text-[#FAF8F5]">
                <span className="text-2xl font-semibold">${villa.price_per_night}</span>
                <span className="text-white/50 text-sm"> / night</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-[#D4A359]"><Star size={13} fill="#D4A359" />{villa.rating}</span>
                <span className={`status-pill ${booked ? "pill-booked" : "pill-free"}`} data-testid="panel-status-pill">
                  {booked ? "Reserved for these dates" : "Available"}
                </span>
              </div>
            </div>

            <p className="text-sm text-white/60 leading-relaxed -mt-2">{villa.tagline}</p>

            <div className="grid grid-cols-4 gap-2">
              {[[BedDouble, `${villa.bedrooms} Beds`], [Bath, `${villa.bathrooms} Baths`], [Users, `${villa.max_guests} Guests`], [Ruler, `${villa.sqft.toLocaleString()} ft²`]].map(([Icon, label], i) => (
                <div key={i} className="spec-cell"><Icon size={15} className="text-[#D4A359]" /><span>{label}</span></div>
              ))}
            </div>

            <div>
              <div className="section-label"><Sparkles size={12} /> Signature amenities</div>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {villa.features.map((f) => (
                  <span key={f} className="amenity-chip"><Check size={11} className="text-[#10B981]" />{f}</span>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3 border-t border-white/10 pt-5">
              <div className="section-label">Reserve your stay</div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-field">
                  <span>Check-in</span>
                  <input type="date" required data-testid="reservation-form-checkin-date" value={localDates.checkIn}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setLocalDates((d) => ({ ...d, checkIn: e.target.value }))} />
                </label>
                <label className="form-field">
                  <span>Check-out</span>
                  <input type="date" required data-testid="reservation-form-checkout-date" value={localDates.checkOut}
                    min={localDates.checkIn}
                    onChange={(e) => setLocalDates((d) => ({ ...d, checkOut: e.target.value }))} />
                </label>
              </div>
              <label className="form-field">
                <span>Full name</span>
                <input type="text" required placeholder="Ava Lindqvist" data-testid="reservation-form-guest-name"
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input type="email" required placeholder="ava@email.com" data-testid="reservation-form-guest-email"
                  value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </label>
              <label className="form-field">
                <span>Guests</span>
                <select data-testid="reservation-form-guests-count" value={form.guests}
                  onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}>
                  {Array.from({ length: villa.max_guests }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </label>

              <div className="price-box" data-testid="panel-price-breakdown">
                <div className="flex justify-between"><span>${villa.price_per_night} × {nights} night{nights !== 1 ? "s" : ""}</span><span>${(villa.price_per_night * nights).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Resort fee</span><span>${RESORT_FEE}</span></div>
                <div className="flex justify-between total-row"><span>Total</span><span>${(villa.price_per_night * nights + (nights > 0 ? RESORT_FEE : 0)).toLocaleString()}</span></div>
              </div>

              <button type="submit" disabled={submitting || nights < 1} className="reserve-btn" data-testid="reservation-form-submit-button">
                {submitting ? "Confirming…" : "Reserve Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
