import { useEffect, useState } from "react";
import {
  ArrowRight,
  X,
  Route,
  QrCode,
  Activity,
  ShieldCheck,
  Boxes,
  Truck,
  Globe,
  Sprout,
  CheckCircle2,
} from "lucide-react";

import "../styles/Home.css";

export default function Home({
  embedded = false,
  onStartMonitoring,
  onGoToDashboard,
  centerDashboardButton = false,
}) {
  const [showDemo, setShowDemo] = useState(false);

  const services = [
    {
      title: "End-to-End Traceability",
      description:
        "Track every product from its origin through production, processing, packaging, and final delivery with complete journey records.",
      icon: Route,
      color: "#8b5cf6",
    },
    {
      title: "QR-Based Product Verification",
      description:
        "Generate unique QR codes and digital product passports to access product details, origin information, and recorded traceability history.",
      icon: QrCode,
      color: "#0ea5e9",
    },
    {
      title: "Production & Process Monitoring",
      description:
        "Monitor every production stage with activity updates, process photographs, timestamps, GPS locations, and digital records.",
      icon: Activity,
      color: "#06b6d4",
    },
    {
      title: "Quality & Authenticity Verification",
      description:
        "Record inspections, certifications, supporting documents, and verification results to strengthen product credibility and consumer trust.",
      icon: ShieldCheck,
      color: "#7c3aed",
    },
    {
      title: "Batch & Inventory Management",
      description:
        "Create and manage production batches, monitor quantities, track stock, and maintain connected records throughout the supply chain.",
      icon: Boxes,
      color: "#f59e0b",
    },
    {
      title: "Supply Chain & Distribution",
      description:
        "Manage suppliers, product movements, orders, packaging, and deliveries while maintaining visibility across every supply-chain connection.",
      icon: Truck,
      color: "#ef4444",
    },
  ];

  const growerFunctions = [
    ["Dashboard", "View plantations, production, and records."],
    ["Plantations", "Manage plantation locations."],
    ["Production", "Record stages, photos, GPS, and updates."],
    ["Traceability", "Track products from origin to processing."],
    ["Quality", "Add inspections and certifications."],
    ["Reports", "Review production and traceability data."],
    ["Profile", "Manage grower account details."],
  ];

  const supplierFunctions = [
    ["Dashboard", "Manage products, batches, and inventory."],
    ["Batches", "Create and track production batches."],
    ["Inventory", "Monitor stock and quantities."],
    ["Supply Chain", "Track sourcing, movement, and delivery."],
    ["Supplier Records", "Manage suppliers, orders, and sourcing."],
    ["Reports", "Review inventory and supply-chain data."],
    ["Profile", "Manage supplier account details."],
  ];

  const traceabilityStages = [
    ["Origin", "Product origin and producer details"],
    ["Production", "Activities, photos, GPS, and timestamps"],
    ["Processing", "Process records and quality updates"],
    ["Packaging", "Batch, quantity, and packing records"],
    ["Delivery", "Verification and final supply-chain movement"],
  ];

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

  useEffect(() => {
    if (!showDemo) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowDemo(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDemo]);

  return (
    <div className="ta-page-wrapper">
      {/* Hero Section */}
      <section className="ta-hero">
        <div className="ta-container ta-hero-inner">
          <div className="ta-hero-content">
            <span className="ta-badge">SUPPLY CHAIN TRACEABILITY</span>
            <h1 className="ta-hero-title">
              From Origin to Destination<br />
              <span className="ta-text-green">Every Step. Every Product. Fully Traced.</span>
            </h1>
            <p className="ta-hero-desc">
              A unified platform to track, monitor, and verify every stage of
              your product journey. Ensure complete transparency, trusted
              records, and end-to-end visibility across your supply chain.
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
                  onClick={() => setShowDemo(true)}
                >
                  Show a Demo
                </button>
              )}
            </div>
          </div>
          <button
            className="ta-hero-visual"
            type="button"
            onClick={() => setShowDemo(true)}
            aria-label="Show the TraceAgri demo video"
          >
            <img src="/Home_image.png" alt="" />
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="ta-services" aria-labelledby="ta-services-title">
        <div className="ta-container">
          <div className="ta-services-heading">
            <h2 className="ta-section-title ta-services-title" id="ta-services-title">
              Our Services
            </h2>
            <p className="ta-services-subtitle">
              Structured digital solutions to support transparent, trusted,
              end-to-end supply-chain management.
            </p>
          </div>

          <div className="ta-services-grid">
            {services.map(({ title, description, icon: Icon, color }) => (
              <article className="ta-service-card" key={title}>
                <Icon className="ta-service-icon" style={{ color }} aria-hidden="true" />
                <div className="ta-service-copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="ta-about" aria-labelledby="ta-about-title">
        <div className="ta-container ta-about-inner">
          <div className="ta-about-icon-wrap" aria-hidden="true">
            <Globe className="ta-about-icon" />
          </div>
          <div className="ta-about-content">
            <h2 id="ta-about-title">About Us</h2>
            <h3>Building Trust Through Transparent Traceability</h3>
            <p>
              TraceConnect is a digital traceability platform designed to bring
              transparency, accountability, and trust to every stage of the
              supply chain. We connect producers, artisans, suppliers,
              businesses, and consumers through a unified ecosystem that
              enables seamless product tracking from origin to destination.
            </p>
            <p>
              Through digital records, QR-based product verification, location
              tracking, production monitoring, and batch management, we make
              product journeys more transparent, accessible, and reliable.
            </p>
            <p>
              Our mission is to empower businesses and producers with
              technology that strengthens supply-chain visibility, promotes
              responsible practices, protects product authenticity, and builds
              lasting consumer confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Traceability Pipeline */}
      <section className="ta-pipeline" aria-labelledby="ta-pipeline-title">
        <div className="ta-container">
          <div className="ta-pipeline-heading">
            <h2 id="ta-pipeline-title">The 5-stage traceability pipeline</h2>
            <p>End-to-end visibility from product origin to final delivery and verification.</p>
          </div>
          <div className="ta-pipeline-track">
            {traceabilityStages.map(([label, description], index) => (
              <div className="ta-pipeline-stage" key={label}>
                <span className="ta-pipeline-number">{index + 1}</span>
                <strong>{label}</strong>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Functions Section */}
      <section className="ta-functions" aria-labelledby="ta-functions-title">
        <div className="ta-container">
          <div className="ta-functions-heading">
            <h2 id="ta-functions-title">Platform Functions</h2>
            <p>Tools designed for every side of the traceability ecosystem.</p>
          </div>
          <div className="ta-functions-grid">
            {[
              ["Grower Functions", growerFunctions, Sprout, "grower"],
              ["Supplier Functions", supplierFunctions, Truck, "supplier"],
            ].map(([title, rows, Icon, variant]) => (
              <article className={`ta-function-card ${variant}`} key={title}>
                <div className="ta-function-card-head">
                  <span className="ta-function-icon" aria-hidden="true"><Icon /></span>
                  <div>
                    <span className="ta-function-kicker">TRACEABILITY ROLE</span>
                    <h3>{title}</h3>
                  </div>
                </div>
                <div className="ta-function-list">
                  {rows.map(([name, description]) => (
                    <div className="ta-function-row" key={name}>
                      <strong><CheckCircle2 aria-hidden="true" />{name}</strong>
                      <span>{description}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Carbon Positive partner section */}
      <section className="ta-carbon-positive" aria-labelledby="ta-carbon-positive-title">
        <div className="ta-container ta-carbon-positive-inner">
          <div className="ta-carbon-positive-brand">
            <img src="/GoCarbonPositive_LOGO.svg" alt="Carbon Positive logo" />
          </div>
          <div className="ta-carbon-positive-copy">
            <span className="ta-carbon-positive-kicker">SUSTAINABILITY PARTNER</span>
            <h2 id="ta-carbon-positive-title">Carbon Positive</h2>
            <p>
              Empowering individuals and organizations to track, reduce, and earn
              rewards for their environmental impact through sustainable practices.
            </p>
          </div>
          <a
            className="ta-carbon-positive-button"
            href="https://www.gocarbonpositive.com/"
            target="_blank"
            rel="noreferrer"
          >
            Visit website <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="ta-feedback" aria-labelledby="ta-feedback-title">
        <div className="ta-container ta-feedback-inner">
          <div className="ta-feedback-copy">
            <span className="ta-feedback-kicker">WE VALUE YOUR FEEDBACK</span>
            <h2 id="ta-feedback-title">Help us make TraceConnect better</h2>
            <p>
              Scan the QR code with your phone to share your thoughts. Your
              feedback helps us improve the experience for everyone.
            </p>
          </div>
          <div className="ta-feedback-qr-wrap">
            <img
              className="ta-feedback-qr"
              src="/Feedback%20QR.svg"
              alt="QR code to share feedback"
            />
            <span>Scan to give feedback</span>
          </div>
        </div>
      </section>

      {/* Demo video opens only after the user selects Show a Demo. */}
      {showDemo && (
        <section
          className="ta-video-section ta-video-modal"
          id="ta-video-section"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ta-video-title"
        >
          <button
            className="ta-video-modal-close"
            type="button"
            onClick={() => setShowDemo(false)}
            aria-label="Close demo video"
          >
            <X aria-hidden="true" />
          </button>
          <div className="ta-container ta-video-inner">
            <h2 className="ta-section-title" id="ta-video-title">
              See TraceAgri in Action
            </h2>
            <p className="ta-section-desc">
              Watch how our platform transforms agricultural data into
              actionable insights.
            </p>
            <div className="ta-video-player">
              <iframe
                src="https://go.screenpal.com/player/cOeQQmnZOLf"
                title="TraceAgri demo video"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
              <div className="ta-video-brand-overlay">
                <span className="ta-video-brand-text">TraceConnect</span>
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
      )}
    </div>
  );
}
