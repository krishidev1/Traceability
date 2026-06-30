import { useEffect } from "react";
import {
  ArrowRight,
  Wheat,
  CheckCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "../styles/TraceabilityPage.css";

const yieldData = [
  { name: "W1", yield: 400 },
  { name: "W2", yield: 300 },
  { name: "W3", yield: 600 },
  { name: "W4", yield: 800 },
  { name: "W5", yield: 500 },
  { name: "W6", yield: 900 },
];

export default function TraceabilityPage({
  embedded = false,
  onStartMonitoring,
  onGoToDashboard,
  centerDashboardButton = false,
}) {
  const scrollToDemo = () => {
    const videoSection = document.getElementById("ta-video-section");
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (embedded) return undefined;

    document.body.classList.add("traceability-page-active");
    document.getElementById("root")?.classList.add("traceability-root-active");

    return () => {
      document.body.classList.remove("traceability-page-active");
      document
        .getElementById("root")
        ?.classList.remove("traceability-root-active");
    };
  }, [embedded]);

  return (
    <div className="ta-page-wrapper">
      {/* Hero Section */}
      <section className="ta-hero">
        <div className="ta-container ta-hero-inner">
          <div className="ta-hero-content">
            <span className="ta-badge">Agricultural Lifecycle Management</span>
            <h1 className="ta-hero-title">
              Full Traceability <br />
              <span className="ta-text-green">From Seed to Batch</span>
            </h1>
            <p className="ta-hero-desc">
              A unified platform to track every stage of your agricultural
              production. Monitor crop health, field activity, and supply chain
              with total transparency.
            </p>
            <div
              className={`ta-hero-btns${centerDashboardButton ? " dashboard-only" : ""}`}
            >
              {!centerDashboardButton &&
                (onStartMonitoring ? (
                  <button
                    className="ta-btn-black ta-btn-lg ta-btn-link"
                    type="button"
                    onClick={onStartMonitoring}
                  >
                    Start Monitoring <ArrowRight size={18} />
                  </button>
                ) : (
                  <a
                    className="ta-btn-black ta-btn-lg ta-btn-link"
                    href="#/auth"
                  >
                    Start Monitoring <ArrowRight size={18} />
                  </a>
                ))}
              {onGoToDashboard ? (
                <button
                  className="ta-btn-outline ta-btn-lg"
                  type="button"
                  onClick={onGoToDashboard}
                >
                  Go to Dashboard
                </button>
              ) : (
                <button
                  className="ta-btn-outline ta-btn-lg"
                  type="button"
                  onClick={scrollToDemo}
                >
                  Show a Demo
                </button>
              )}
            </div>
          </div>

          <div className="ta-hero-visual">
            <div className="ta-dashboard-card">
              <div className="ta-card-header">
                <div>
                  <h4 className="ta-card-title">Live Traceability</h4>
                  <p className="ta-card-subtitle">
                    Batch: #AG-7429 - Premium Wheat
                  </p>
                </div>
                <span className="ta-status-pill">In Progress</span>
              </div>
              <div className="ta-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yieldData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="yield"
                      stroke="#14a236"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#14a236" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="ta-card-stats">
                <div className="ta-mini-stat">
                  <span className="ta-mini-label">Health</span>
                  <span className="ta-mini-val ta-text-green">98%</span>
                </div>
                <div className="ta-mini-stat">
                  <span className="ta-mini-label">Water</span>
                  <span className="ta-mini-val">Optimal</span>
                </div>
                <div className="ta-mini-stat">
                  <span className="ta-mini-label">ETA</span>
                  <span className="ta-mini-val">12 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="ta-stats-bar">
        <div className="ta-container ta-stats-grid">
          <div className="ta-stat-item">
            <Wheat className="ta-stat-icon" />
            <h3 className="ta-stat-val">1,240</h3>
            <p className="ta-stat-label">Total Batches</p>
          </div>
          <div className="ta-stat-item">
            <CheckCircle className="ta-stat-icon" />
            <h3 className="ta-stat-val">99.8%</h3>
            <p className="ta-stat-label">Compliance</p>
          </div>
          <div className="ta-stat-item">
            <TrendingUp className="ta-stat-icon" />
            <h3 className="ta-stat-val">45.2k</h3>
            <p className="ta-stat-label">Metric Tons</p>
          </div>
          <div className="ta-stat-item">
            <Clock className="ta-stat-icon" />
            <h3 className="ta-stat-val">24/7</h3>
            <p className="ta-stat-label">Real-time Alerts</p>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="ta-video-section" id="ta-video-section">
        <div className="ta-container ta-video-inner">
          <h2 className="ta-section-title">See TraceAgri in Action</h2>
          <p className="ta-section-desc">
            Watch how our platform transforms agricultural data into actionable
            insights.
          </p>
          <div className="ta-video-player">
            <iframe
              src="https://go.screenpal.com/player/cOeQQmnZOLf"
              title="TraceAgri demo video"
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <div className="ta-video-brand-overlay">
              <span className="ta-video-brand-text">TRACECONNECT</span>
            </div>
          </div>
          <a
            className="ta-video-link"
            href="https://go.screenpal.com/watch/cOeQQmnZOLf"
            target="_blank"
            rel="noreferrer"
          >
            Open video in new tab
          </a>
        </div>
      </section>
    </div>
  );
}
