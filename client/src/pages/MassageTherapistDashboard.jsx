import React, { useMemo, useState } from "react";
import "../css/MassageTherapistDashboard.css";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  Bell,
  Scissors,
  LayoutDashboard,
  ListChecks,
  LogOut,
} from "lucide-react";

const tabItems = [
  { key: "overview", label: "Pregled", icon: LayoutDashboard },
  { key: "availability", label: "Dostupnost", icon: CalendarDays },
  { key: "schedule", label: "Raspored", icon: Clock3 },
  { key: "bookings", label: "Rezervacije", icon: ListChecks },
];

const statusLabels = {
  pending: "Na čekanju",
  confirmed: "Potvrđeno",
  rejected: "Odbijeno",
  done: "Završeno",
};

export default function MassageTherapistDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [therapistAvailable, setTherapistAvailable] = useState(false);

  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const todayBookings = useMemo(() => {
    return bookings.filter((booking) => booking.date === today);
  }, [bookings, today]);

  const pendingBookingsCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "pending").length;
  }, [bookings]);

  const groupedSchedule = useMemo(() => {
    return bookings.reduce((groups, booking) => {
      if (!groups[booking.date]) groups[booking.date] = [];
      groups[booking.date].push(booking);
      return groups;
    }, {});
  }, [bookings]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilitySubmit = (event) => {
    event.preventDefault();
    console.log("Dodaj dostupnost:", formData);
  };

  const handleDeleteAvailability = (availabilityId) => {
    console.log("Obriši dostupnost:", availabilityId);
  };

  const handleBookingStatusChange = (bookingId, newStatus) => {
    console.log("Promijeni status rezervacije:", bookingId, newStatus);
  };

  const renderOverview = () => (
    <section className="massage-section">
      <div className="massage-stats-grid">
        <StatCard
          title="Današnje rezervacije"
          value={todayBookings.length}
          icon={<CalendarDays size={20} />}
        />
        <StatCard
          title="Slobodni termini"
          value={availability.length}
          icon={<Clock3 size={20} />}
        />
        <StatCard
          title="Na čekanju"
          value={pendingBookingsCount}
          icon={<Bell size={20} />}
        />
        <StatCard
          title="Status"
          value={therapistAvailable ? "Dostupna" : "Nedostupna"}
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <div className="massage-card">
        <div className="massage-card-header">
          <div>
            <h3>Početni pregled</h3>
            <p>Ovdje će dolaziti podaci iz baze.</p>
          </div>
        </div>

        <EmptyState text="Poveži API i prikaži stvarne podatke." />
      </div>
    </section>
  );

  const renderAvailability = () => (
    <section className="massage-two-column">
      <div className="massage-card">
        <div className="massage-card-header">
          <div>
            <h3>Dodaj dostupnost</h3>
            <p>Forma spremna za backend povezivanje.</p>
          </div>
        </div>

        <form className="massage-form" onSubmit={handleAvailabilitySubmit}>
          <div className="massage-form-group">
            <label htmlFor="date">Datum</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
            />
          </div>

          <div className="massage-form-row">
            <div className="massage-form-group">
              <label htmlFor="startTime">Od</label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
              />
            </div>

            <div className="massage-form-group">
              <label htmlFor="endTime">Do</label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <button type="submit" className="massage-button massage-button-primary">
            Sačuvaj
          </button>
        </form>
      </div>

      <div className="massage-card">
        <div className="massage-card-header">
          <div>
            <h3>Lista dostupnosti</h3>
            <p>Ovdje će se prikazivati termini iz baze.</p>
          </div>
        </div>

        {availability.length === 0 ? (
          <EmptyState text="Nema unesenih termina." />
        ) : (
          <div className="massage-list">
            {availability.map((slot) => (
              <div key={slot.id} className="massage-list-item">
                <div>
                  <strong>{slot.date}</strong>
                  <p>
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>

                <button
                  type="button"
                  className="massage-button massage-button-danger"
                  onClick={() => handleDeleteAvailability(slot.id)}
                >
                  Obriši
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderSchedule = () => (
    <section className="massage-card">
      <div className="massage-card-header">
        <div>
          <h3>Raspored</h3>
          <p>Rezervacije grupisane po datumu.</p>
        </div>
      </div>

      {Object.keys(groupedSchedule).length === 0 ? (
        <EmptyState text="Raspored je trenutno prazan." />
      ) : (
        <div className="massage-schedule-groups">
          {Object.entries(groupedSchedule).map(([date, items]) => (
            <div key={date} className="massage-schedule-group">
              <h4>{date}</h4>

              <div className="massage-list">
                {items.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderBookings = () => (
    <section className="massage-section">
      {bookings.length === 0 ? (
        <div className="massage-card">
          <EmptyState text="Trenutno nema rezervacija." />
        </div>
      ) : (
        <div className="massage-bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="massage-card">
              <div className="massage-booking-top">
                <div>
                  <h3>{booking.serviceName}</h3>
                  <p>
                    Soba {booking.roomNumber} · {booking.date} · {booking.startTime} - {booking.endTime}
                  </p>
                  <p>Napomena: {booking.note || "-"}</p>
                </div>

                <span className={`massage-status massage-status-${booking.status}`}>
                  {statusLabels[booking.status] || booking.status}
                </span>
              </div>

              <div className="massage-booking-actions">
                <button
                  type="button"
                  className="massage-button massage-button-success"
                  onClick={() => handleBookingStatusChange(booking.id, "confirmed")}
                >
                  Prihvati
                </button>
                <button
                  type="button"
                  className="massage-button massage-button-danger"
                  onClick={() => handleBookingStatusChange(booking.id, "rejected")}
                >
                  Odbij
                </button>
                <button
                  type="button"
                  className="massage-button massage-button-secondary"
                  onClick={() => handleBookingStatusChange(booking.id, "done")}
                >
                  Završeno
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="massage-dashboard">
      <div className="massage-layout">
        <aside className="massage-sidebar">
          <div>
            <div className="massage-brand">
              <div className="massage-brand-icon">
                <Scissors size={22} />
              </div>
              <div>
                <p>Hotel panel</p>
                <h1>Dashboard maserke</h1>
              </div>
            </div>

            <nav className="massage-nav">
              {tabItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`massage-nav-button ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <button type="button" className="massage-logout-button">
            <LogOut size={18} />
            <span>Odjava</span>
          </button>
        </aside>

        <main className="massage-main">
          <header className="massage-header-card">
            <div>
              <p className="massage-header-label">Dobrodošli</p>
              <h2>Maserka</h2>
              <p className="massage-header-date">Ovdje kasnije spoji podatke korisnika iz backenda.</p>
            </div>

            <div className="massage-header-actions">
              <button
                type="button"
                className={`massage-availability-toggle ${therapistAvailable ? "available" : "unavailable"}`}
                onClick={() => setTherapistAvailable((prev) => !prev)}
              >
                Status: {therapistAvailable ? "Dostupna" : "Nedostupna"}
              </button>

              <div className="massage-notification-badge">
                <Bell size={18} />
                <span>{pendingBookingsCount} novih zahtjeva</span>
              </div>
            </div>
          </header>

          {activeTab === "overview" && renderOverview()}
          {activeTab === "availability" && renderAvailability()}
          {activeTab === "schedule" && renderSchedule()}
          {activeTab === "bookings" && renderBookings()}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="massage-stat-card">
      <div className="massage-stat-top">
        <p>{title}</p>
        <div className="massage-stat-icon">{icon}</div>
      </div>
      <div className="massage-stat-value">{value}</div>
    </div>
  );
}

function BookingRow({ booking }) {
  return (
    <div className="massage-list-item">
      <div>
        <strong>{booking.serviceName}</strong>
        <p>
          Soba {booking.roomNumber} · {booking.startTime} - {booking.endTime}
        </p>
      </div>

      <span className={`massage-status massage-status-${booking.status}`}>
        {statusLabels[booking.status] || booking.status}
      </span>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="massage-empty-state">{text}</div>;
}