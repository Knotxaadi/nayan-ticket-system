import { useRef, useState } from "react";
import {
  Download,
  Mail,
  Music,
  Ticket,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import "./App.css";

// Put your artwork at public/nayan-ticket.png.
// If your file has another name, change this path.
const TICKET_ARTWORK = "images/nayan.webp";

export default function App() {
  const ticketRef = useRef(null);

  const [data, setData] = useState({
    name: "",
    email: "",
    ticketName: "Phase 1",
    price: "600",
    ticketNumber: "NAYAN-001",
    eventDate: "31 OCTOBER 2026",
    venue: "Navi Mumbai",
  });

  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function update(e) {
    setData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  async function createTicketImage() {
    if (!ticketRef.current) {
      throw new Error("Ticket preview is not available.");
    }

    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#090909",
      logging: false,
    });

    return canvas;
  }

  async function downloadTicket() {
    setDownloading(true);
    setMessage("");
    setError(false);

    try {
      const canvas = await createTicketImage();
      const link = document.createElement("a");

      link.download = `${data.ticketNumber || "NAYAN-ticket"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setMessage("Your ticket PNG has been downloaded.");
    } catch (err) {
      setError(true);
      setMessage(err.message || "Unable to download ticket.");
    } finally {
      setDownloading(false);
    }
  }

  async function sendTicketEmail(e) {
    e.preventDefault();
    setSending(true);
    setMessage("");
    setError(false);

    try {
      if (!data.name.trim()) {
        throw new Error("Enter the attendee's name.");
      }

      if (!data.email.trim()) {
        throw new Error("Enter the attendee's email address.");
      }

      if (!data.ticketNumber.trim()) {
        throw new Error("Enter a ticket number.");
      }

      if (!Number.isFinite(Number(data.price)) || Number(data.price) < 0) {
        throw new Error("Enter a valid ticket price.");
      }

      const canvas = await createTicketImage();
      const ticketImage = canvas.toDataURL("image/png");

      const response = await fetch("/api/send-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          ticketImage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send email.");
      }

      setMessage(`Ticket email sent to ${data.email}.`);
    } catch (err) {
      setError(true);
      setMessage(err.message || "Unable to send ticket.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          N<span>A</span>YAN.
        </div>
        <div className="admin-label">TICKET STUDIO / 2026</div>
      </header>

      <section className="intro">
        <p className="eyebrow">THE MEHFEEL PRESENTS</p>
        <h1>
          Create your <span>ticket.</span>
        </h1>
        <p>Personalize. Preview. Download. Send.</p>
      </section>

      <section className="workspace">
        <form className="panel" onSubmit={sendTicketEmail}>
          <h2>Ticket details</h2>

          <label htmlFor="name">Attendee name</label>
          <input
            id="name"
            name="name"
            value={data.name}
            onChange={update}
            placeholder="Enter attendee name"
            required
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={data.email}
            onChange={update}
            placeholder="attendee@example.com"
            required
          />

          <label htmlFor="ticketName">Ticket category</label>
          <select
            id="ticketName"
            name="ticketName"
            value={data.ticketName}
            onChange={update}
          >
            <option>Early Bird</option>
            <option>Phase 1</option>
            <option>Phase 2</option>
            <option>VIP</option>
            <option>Backstage</option>
          </select>

          <div className="two-cols">
            <div>
              <label htmlFor="price">Ticket price (₹)</label>
              <select
                id="price"
                name="price"
                value={data.price}
                onChange={update}
              >
                <option>600</option>
                <option>799</option>
                <option>999</option>
              </select>
            </div>

            <div>
              <label htmlFor="ticketNumber">Ticket number</label>
              <input
                id="ticketNumber"
                name="ticketNumber"
                value={data.ticketNumber}
                onChange={update}
                required
              />
            </div>
          </div>

          <label htmlFor="eventDate">Event date</label>
          <input
            id="eventDate"
            name="eventDate"
            value={data.eventDate}
            onChange={update}
          />

          <label htmlFor="venue">Venue</label>
          <input id="venue" name="venue" value={data.venue} onChange={update} />

          <div className="button-stack">
            <button className="primary-btn" type="submit" disabled={sending}>
              {sending ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Mail size={18} />
              )}
              {sending ? "Sending email..." : "Generate & Send Ticket"}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={downloadTicket}
              disabled={downloading}
            >
              <Download size={18} />
              {downloading ? "Preparing PNG..." : "Download ticket PNG"}
            </button>
          </div>

          {message && (
            <p
              className={`status-message ${error ? "error" : "success"}`}
              role="status"
            >
              {!error && <CheckCircle2 size={16} />}
              {message}
            </p>
          )}
        </form>

        <div className="preview-area">
          <div className="preview-heading">
            <span>LIVE PREVIEW</span>
            <span>01 / TICKET</span>
          </div>

          <article className="ticket" ref={ticketRef}>
            <img
              className="ticket-artwork"
              src={TICKET_ARTWORK}
              alt="NAYAN event artwork"
              crossOrigin="anonymous"
              fetchPriority="high"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div className="ticket-overlay">
              <div className="ticket-top">
                <span>THE MEHFEEL PRESENTS</span>
                <Music size={23} />
              </div>

              <div className="event-title">
                <span>YIN × YANG</span>
                <h2>NAYAN</h2>
                <p>AN IMMERSIVE MUSIC EXPERIENCE</p>
              </div>

              <div className="ticket-rule" />

              <div className="ticket-attendee">
                <small>ADMIT ONE</small>
                <h3>{data.name || "ATTENDEE NAME"}</h3>
                <p>{data.email || "attendee@example.com"}</p>
              </div>

              <div className="ticket-info">
                <div>
                  <small>TICKET TYPE</small>
                  <strong>{data.ticketName}</strong>
                </div>
                <div>
                  <small>PRICE PAID</small>
                  <strong>₹{data.price}</strong>
                </div>
              </div>

              <div className="ticket-bottom">
                <div>
                  <small>DATE</small>
                  <strong>{data.eventDate}</strong>
                  <small className="venue">{data.venue}</small>
                </div>

                <div className="ticket-number">
                  <Ticket size={19} />
                  <strong>{data.ticketNumber}</strong>
                </div>
              </div>

              <div className="ticket-footer">MUSIC • CULTURE • CONNECTION</div>
            </div>
          </article>

          <p className="hint">
            Your current preview is rendered as a PNG and attached to the email.
            The artwork file must exist in the public folder.
          </p>
        </div>
      </section>

      <footer>NAYAN © 2026 — MADE FOR THE CULTURE</footer>
    </main>
  );
}
