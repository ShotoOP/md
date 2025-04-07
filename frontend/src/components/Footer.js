import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer bg-dark text-center py-4">
      <hr className="border border-warning border-2 opacity-50" />
      <h5 className="mb-3 text-white">Follow Us</h5>
      <div className="social-icons">
        <a href="#" className="social-link">
          <i className="bi bi-facebook"></i>
        </a>
        <a href="#" className="social-link">
          <i className="bi bi-twitter"></i>
        </a>
        <a href="#" className="social-link">
          <i className="bi bi-instagram"></i>
        </a>
        <a href="#" className="social-link">
          <i className="bi bi-linkedin"></i>
        </a>
      </div>
      <ul className="footer-links mt-3">
        <li>
          <a href="#">Privacy Policy</a>
        </li>
        <li>
          <a href="#">Terms of Service</a>
        </li>
        <li>
          <a href="#">Contact</a>
        </li>
      </ul>
      <p className="mt-3 text-warning">
        © {new Date().getFullYear()} Mindstocs. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
