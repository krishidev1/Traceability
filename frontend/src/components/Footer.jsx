import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

import "../styles/Footer.css";

export default function Footer({ navigate, logoSrc }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <button
          className="site-footer-brand"
          onClick={() => navigate?.("/")}
          type="button"
        >
          <img src={logoSrc} alt="TraceConnect Logo" />
          <span className="brand-text">TraceConnect</span>
        </button>

        <p className="site-footer-copyright">
          © 2026 Debadarsan Consulting Private Limited. All rights reserved.
        </p>

        <div className="site-footer-socials" aria-label="Social links">
          <a
            href="https://www.facebook.com/gocarbonpositive"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <FaFacebookF />
          </a>

          <a
            href="https://x.com/gocarbonpositive"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
          >
            <FaXTwitter />
          </a>

          <a
            href="https://www.linkedin.com/company/gocarbonpositive"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedinIn />
          </a>

          <a
            href="https://www.instagram.com/gocarbonpositive"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
        </div>

        <nav className="site-footer-legal" aria-label="Legal">
          <span>Privacy Policy</span>
          <span>Terms &amp; Conditions</span>
        </nav>
      </div>
    </footer>
  );
}
