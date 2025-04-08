import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Data Submitted:", formData);
        alert("Thank you for contacting us!");
        setFormData({
            name: "",
            email: "",
            phone: "",
            message: "",
        });
    };

    return (
        <>
            <Header />
            <div className="container mt-5 mb-5">
                <h1 className="text-center mb-4 text-light">Contact Us</h1>
                <p className="text-center text-light">We'd love to hear from you! Please fill out the form below.</p>
                <form
                    onSubmit={handleSubmit}
                    className="mx-auto p-4 bg-dark text-light rounded shadow-lg"
                    style={{
                        maxWidth: "600px",
                        animation: "fadeIn 1s ease-in-out",
                    }}
                >
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                            Name:
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-control border-warning bg-dark text-light"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="form-control border-warning bg-dark text-light"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="phone" className="form-label">
                            Phone:
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="form-control border-warning bg-dark text-light"
                            placeholder="Enter your phone number"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="message" className="form-label">
                            Message:
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            className="form-control border-warning bg-dark text-light"
                            rows="4"
                            placeholder="Enter your message"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-warning w-100"
                        style={{
                            animation: "pulse 1.5s infinite",
                        }}
                    >
                        Submit
                    </button>
                </form>
            </div>
            <Footer />
            <style>
                {`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(1);
                        }
                        50% {
                            transform: scale(1.05);
                        }
                    }
                    input::placeholder, textarea::placeholder {
                        color: grey;
                    }
                `}
            </style>
        </>
    );
};

export default ContactUs;