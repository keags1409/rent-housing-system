import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, Trash2, RefreshCw, CalendarCheck, DollarSign, Users, Home, Lock, LogOut } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "aura_admin_token";

const formatDetail = (d) => (typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => e?.msg).join(" ") : "Something went wrong");

export const AdminView = ({ onChange }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }), []);

  const load = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        axios.get(`${API}/reservations`, { headers: authHeaders() }),
        axios.get(`${API}/stats`),
      ]);
      setReservations(r.data);
      setStats(s.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        toast.error("Session expired — please log in again");
      } else {
        toast.error("Could not load reservations");
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const login = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const r = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem(TOKEN_KEY, r.data.token);
      setToken(r.data.token);
      setPassword("");
      toast.success("Welcome back, owner");
    } catch (err) {
      toast.error(formatDetail(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const remove = async (id, name) => {
    try {
      await axios.delete(`${API}/reservations/${id}`, { headers: authHeaders() });
      toast.success(`Reservation for ${name} cancelled`);
      load();
      onChange();
    } catch {
      toast.error("Could not cancel reservation");
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return reservations.filter((r) =>
      !q || r.guest_name.toLowerCase().includes(q) || r.guest_email.toLowerCase().includes(q) || r.villa_name.toLowerCase().includes(q)
    );
  }, [reservations, query]);

  if (!token) {
    return (
      <div className="admin-wrap" data-testid="admin-view">
        <div className="min-h-full flex items-center justify-center px-5">
          <form onSubmit={login} className="modal-card w-full max-w-sm" data-testid="admin-login-form">
            <div className="brand-badge mb-4"><Lock size={14} /></div>
            <div className="section-label">Owner access only</div>
            <h2 className="font-display text-2xl text-[#FAF8F5] mt-2">Resort Operations</h2>
            <p className="text-sm text-white/50 mt-1 mb-4">Enter the owner password to view reservations.</p>
            <input
              type="password"
              required
              placeholder="Owner password"
              data-testid="admin-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="modal-input w-full"
            />
            <button type="submit" className="reserve-btn w-full mt-4" disabled={loggingIn} data-testid="admin-login-button">
              {loggingIn ? "Checking…" : "Unlock Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const metrics = [
    { icon: CalendarCheck, label: "Total Bookings", value: stats?.total_bookings ?? "—" },
    { icon: DollarSign, label: "Total Revenue", value: stats ? `$${stats.total_revenue.toLocaleString()}` : "—" },
    { icon: Users, label: "Unique Guests", value: stats?.unique_guests ?? "—" },
    { icon: Home, label: "Villas", value: stats?.villas_count ?? "—" },
  ];

  return (
    <div className="admin-wrap" data-testid="admin-view">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-32 md:pt-24 pb-12">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#D4A359] mb-2">Resort Operations</div>
            <h1 className="font-display text-3xl sm:text-4xl text-[#FAF8F5]">Reservations</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="admin-search">
              <Search size={14} className="text-white/40" />
              <input data-testid="admin-search-input" placeholder="Search guest, email, villa…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button data-testid="admin-refresh-button" onClick={load} className="admin-refresh"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
            <button data-testid="admin-logout-button" onClick={logout} className="admin-refresh" title="Log out"><LogOut size={14} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="metric-card">
              <Icon size={16} className="text-[#D4A359]" />
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-[#FAF8F5]">{value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40 font-mono">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table" data-testid="admin-reservations-table">
            <thead>
              <tr>
                <th>Guest</th><th>Villa</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Total</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-row">{loading ? "Loading…" : "No reservations yet — pick a villa on the 3D map."}</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} data-testid={`admin-reservation-row-${r.id}`}>
                  <td>
                    <div className="text-[#FAF8F5] font-medium">{r.guest_name}</div>
                    <div className="text-white/40 text-xs">{r.guest_email}</div>
                  </td>
                  <td className="text-white/80">{r.villa_name}</td>
                  <td className="font-mono text-xs text-white/70">{r.check_in}</td>
                  <td className="font-mono text-xs text-white/70">{r.check_out}</td>
                  <td className="text-white/70">{r.guests}</td>
                  <td className="text-[#D4A359] font-semibold">${r.total_price.toLocaleString()}</td>
                  <td><span className="status-pill pill-free">{r.status}</span></td>
                  <td>
                    <button data-testid={`admin-delete-reservation-${r.id}`} onClick={() => remove(r.id, r.guest_name)} className="delete-btn">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
