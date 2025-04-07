import React, { useState, useEffect } from "react";
import { BiCollection, BiCog, BiTachometer, BiTable } from "react-icons/bi";
import Marquee from "react-fast-marquee";
import LiveChat from "../components/LiveChat.js";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext.js";
import "./Home.css";
import { motion } from "framer-motion";
import RankingList from "../components/RankingList.js";

const plans = [
  {
    name: "Iron",
    price: "$9",
    users: "10 users included",
    storage: "2 GB of storage",
    support: "Email support",
    btnText: "Invest Now",
  },
  {
    name: "Silver",
    price: "$19",
    users: "20 users included",
    storage: "10 GB of storage",
    support: "Priority email support",
    btnText: "Invest Now",
  },
  {
    name: "Gold",
    price: "$29",
    users: "30 users included",
    storage: "50 GB of storage",
    support: "Phone & email support",
    btnText: "Invest Now",
    recommended: true, // Highlighted plan
  },
  {
    name: "Platinum",
    price: "$49",
    users: "Unlimited users",
    storage: "100 GB of storage",
    support: "24/7 Support",
    btnText: "Invest Now",
  },
];

const users = [
  {
    name: "John Doe",
    username: "@johndoe",
    ranking: 1,
    investment: "$10,000",
  },
  {
    name: "Jane Smith",
    username: "@janesmith",
    ranking: 2,
    investment: "$9,500",
  },
  {
    name: "Alice Brown",
    username: "@alicebrown",
    ranking: 3,
    investment: "$9,000",
  },
  {
    name: "Bob Johnson",
    username: "@bobjohnson",
    ranking: 4,
    investment: "$8,500",
  },
  {
    name: "Charlie Lee",
    username: "@charlielee",
    ranking: 5,
    investment: "$8,000",
  },
  {
    name: "David Kim",
    username: "@davidkim",
    ranking: 6,
    investment: "$7,500",
  },
  {
    name: "Eve Adams",
    username: "@eveadams",
    ranking: 7,
    investment: "$7,000",
  },
  {
    name: "Frank Wilson",
    username: "@frankwilson",
    ranking: 8,
    investment: "$6,500",
  },
];

const Home = () => {
  const generateRecentDates = (count) => {
    const today = new Date();
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      );
      return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    });
  };

  const [activeTab, setActiveTab] = useState("deposit");
  const [visibleIndex, setVisibleIndex] = useState(0);

  const dates = generateRecentDates(10); // Generate 10 recent dates dynamically

  const depositData = [
    { name: "John Doe", amount: "$500", gateway: "PayPal" },
    { name: "Alice Smith", amount: "$200", gateway: "Stripe" },
    { name: "Robert Johnson", amount: "$350", gateway: "Crypto" },
    { name: "Emily Brown", amount: "$150", gateway: "Bank Transfer" },
    { name: "Chris Evans", amount: "$700", gateway: "PayPal" },
    { name: "Sophia Miller", amount: "$450", gateway: "Stripe" },
    { name: "Daniel Wilson", amount: "$600", gateway: "Crypto" },
    { name: "Olivia Taylor", amount: "$300", gateway: "Bank Transfer" },
    { name: "James Anderson", amount: "$250", gateway: "PayPal" },
    { name: "Charlotte Moore", amount: "$550", gateway: "Stripe" },
  ].map((item, index) => ({ ...item, date: dates[index] }));

  const withdrawData = [
    { name: "Michael Johnson", amount: "$300", gateway: "Bank Transfer" },
    { name: "Emma Brown", amount: "$150", gateway: "Crypto" },
    { name: "David Clark", amount: "$400", gateway: "PayPal" },
    { name: "Sophia White", amount: "$220", gateway: "Stripe" },
    { name: "William Martinez", amount: "$330", gateway: "Crypto" },
    { name: "Isabella Harris", amount: "$500", gateway: "Bank Transfer" },
    { name: "Benjamin Lewis", amount: "$600", gateway: "PayPal" },
    { name: "Mia Walker", amount: "$250", gateway: "Stripe" },
    { name: "Ethan Hall", amount: "$450", gateway: "Crypto" },
    { name: "Amelia Allen", amount: "$550", gateway: "Bank Transfer" },
  ].map((item, index) => ({ ...item, date: dates[index] }));

  const activeData = activeTab === "deposit" ? depositData : withdrawData;
  const visibleData = activeData.slice(visibleIndex, visibleIndex + 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIndex((prevIndex) => (prevIndex + 1) % (activeData.length - 4));
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const [plan, setPlan] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const planAmounts = {
    Basic: 100,
    Premium: 500,
    Gold: 1000,
  };

  const planMessages = {
    Basic: "A great starting point for beginners!",
    Premium: "Boost your investment with higher returns!",
    Gold: "Maximize your profits with the best plan!",
  };

  const getProfit = () => {
    let profit = 0;
    if (plan === "Basic") profit = 0.05;
    else if (plan === "Premium") profit = 0.1;
    else if (plan === "Gold") profit = 0.15;
    return plan ? (planAmounts[plan] * profit).toFixed(2) : "0.00";
  };

  const faqs = [
    {
      question: "What is the minimum investment amount?",
      answer:
        "Deposit and withdrawal are available for at any time. Be sure, that your funds are not used in any ongoing trade before the withdrawal. The available amount is shown in your dashboard on the main page of Investing platform. Deposit and withdrawal are available for at any time. Be sure, that your funds are not used in any ongoing trade before the withdrawal. The available amount is shown in your dashboard on the main page of Investing platform.",
    },
    {
      question: "How do I withdraw my profits?",
      answer: "You can withdraw profits through your account dashboard.",
    },
    {
      question: "Are there any hidden fees?",
      answer: "No, there are no hidden fees.",
    },
    {
      question: "I forgot my password, what should I do?",
      answer:
        "Visit the password reset page, type in your email address and click the `Reset` button. Visit the password reset page, type in your email address and click the `Reset` button.",
    },
  ];

  const toggleFAQ = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const { user } = useAuth(); // Get user from AuthContext

  return (
    <div className="home">
      <Header />
      <div
        className="text-secondary px-4 py-5 text-start"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/free-vector/golden-dust-elements-falling-down_260559-287.jpg?t=st=1742650392~exp=1742653992~hmac=2184d08f7e27b19303651c81e97d37fc10f6e29078b1d3bd63b2e37c8a69e240&w=1060')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed", // Helps maintain sharpness
          imageRendering: "crisp-edges", // Helps with pixelation
        }}
      >
        <div className="py-5">
          <h1 className="display-5 fw-bold text-white">
            Invest for Future in Stable Platform <br />
          </h1>
          <h1 className="display-5 fw-bold text-warning">
            and Make Fast Money <br />
            with Secure Investments
          </h1>
          <div className="col-lg-6">
            <p className="fs-5 mb-4 text-white">
              Quickly design and customize responsive mobile-first sites with
              Bootstrap, the world's most popular front-end open-source toolkit,
              featuring Sass variables and mixins, responsive grid system,
              extensive prebuilt components, and powerful JavaScript plugins.
            </p>
            <div className="justify-content-start">
              <button
                type="button"
                className="btn btn-outline-warning btn-lg px-4 me-sm-3 fw-bold"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className=" text-secondary px-4 py-5 text-start"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/free-vector/golden-dust-elements-falling-down_260559-287.jpg?t=st=1742650392~exp=1742653992~hmac=2184d08f7e27b19303651c81e97d37fc10f6e29078b1d3bd63b2e37c8a69e240&w=1060')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed", // Helps maintain sharpness
          imageRendering: "crisp-edges", // Helps with pixelation
        }}
      >
        <div className="py-5">
          <h2 className="pb-2 text-warning border-bottom">About Us</h2>
          <div className="d-flex justify-content-start">
            <div className="col-lg-6">
              <p className="fs-5 mb-5 text-white">
                Quickly design and customize responsive mobile-first sites with
                Bootstrap, the world's most popular front-end open source
                toolkit, featuring Sass variables and mixins, responsive grid
                system, extensive prebuilt components, and powerful JavaScript
                plugins.
              </p>
              <div className="d-flex justify-content-start">
                <button
                  type="button"
                  className="btn btn-outline-warning btn-lg px-4 me-sm-3 fw-bold"
                >
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className=" text-secondary px-4 py-5 text-start"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/free-vector/golden-dust-elements-falling-down_260559-287.jpg?t=st=1742650392~exp=1742653992~hmac=2184d08f7e27b19303651c81e97d37fc10f6e29078b1d3bd63b2e37c8a69e240&w=1060')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed", // Helps maintain sharpness
          imageRendering: "crisp-edges", // Helps with pixelation
        }}
      >
        <h2 className="pb-2 border-bottom text-warning">Services</h2>
        <div className="row row-cols-1 row-cols-md-2 align-items-md-center g-5 py-5">
          <div className="col d-flex flex-column align-items-start gap-2">
            <h2 className="fw-bold text-warning">
              Left-aligned title explaining these awesome Services
            </h2>
            <p className="text-white">
              Paragraph of text beneath the heading to explain the heading.
              We'll add onto it with another sentence and probably just keep
              going until we run out of words.
            </p>
            <button
              type="button"
              className="btn btn-warning btn-lg px-4 me-sm-3 fw-bold"
            >
              More Services
            </button>
          </div>

          <div className="col">
            <div className="row row-cols-1 row-cols-sm-2 g-4">
              <div className="col d-flex flex-column gap-2">
                <div className="feature-icon-small d-inline-flex fs-4 rounded-3">
                  <BiCollection size={30} color="gold" />
                </div>
                <h4 className="fw-semibold mb-0 text-warning">
                  Featured title
                </h4>
                <p className="text-white">
                  Paragraph of text beneath the heading to explain the heading.
                </p>
              </div>

              <div className="col d-flex flex-column gap-2">
                <div className="feature-icon-small d-inline-flex fs-4 rounded-3">
                  <BiCog size={30} color="gold" /> {/* Bootstrap icon */}
                </div>
                <h4 className="fw-semibold mb-0 text-warning">
                  Featured title
                </h4>
                <p className="text-white">
                  Paragraph of text beneath the heading to explain the heading.
                </p>
              </div>

              <div className="col d-flex flex-column gap-2">
                <div className="feature-icon-small d-inline-flex fs-4 rounded-3">
                  <BiTachometer size={30} color="gold" /> {/* Bootstrap icon */}
                </div>
                <h4 className="fw-semibold mb-0 text-warning">
                  Featured title
                </h4>
                <p className="text-white">
                  Paragraph of text beneath the heading to explain the heading.
                </p>
              </div>

              <div className="col d-flex flex-column gap-2">
                <div className="feature-icon-small d-inline-flex fs-4 rounded-3">
                  <BiTable size={30} color="gold" /> {/* Bootstrap icon */}
                </div>
                <h4 className="fw-semibold mb-0 text-warning">
                  Featured title
                </h4>
                <p className="text-white">
                  Paragraph of text beneath the heading to explain the heading.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className=" text-secondary px-4 py-5 text-start"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/free-vector/golden-dust-elements-falling-down_260559-287.jpg?t=st=1742650392~exp=1742653992~hmac=2184d08f7e27b19303651c81e97d37fc10f6e29078b1d3bd63b2e37c8a69e240&w=1060')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed", // Helps maintain sharpness
          imageRendering: "crisp-edges", // Helps with pixelation
        }}
      >
        <h2 className="pb-2 border-bottom text-warning">Plans & Pricing</h2>
        <p className="fw-semibold text-white">
          It is a long established fact that a reader will be distracted by the
          readable content of a page when looking at its layout.
        </p>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {plans.map((plan, index) => (
            <div className="col" key={index}>
              <div
                className={`card pricing-card h-100 text-white border-white hover-effect`}
                style={{
                  backgroundColor: "#1a1a1a", // Dark background
                  border: "2px solid white", // Default white border
                  transition: "border-color 0.3s ease", // Smooth border transition
                  backgroundImage:
                    "url('https://img.freepik.com/free-vector/abstract-black-gold-luxury-background_361591-4346.jpg?t=st=1742013613~exp=1742017213~hmac=acc2623f9672c7062cc6ac248da6fe6b91d9d39814eb10a677e1bd0dac56fb7c&w=360')", // Gold background image
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#ffd700")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "white")
                }
              >
                <div
                  className="card-header fw-bold"
                  style={{
                    color: "#ffc107", // White text
                    padding: "15px",
                    fontSize: "1.5rem",
                    borderBottom: "none", // Removes the bottom border
                  }}
                >
                  {plan.name}
                </div>
                <div className="card-body d-flex flex-column">
                  <h1 className="card-title text-white">
                    {plan.price}
                    <small className="text-warning">/mo</small>
                  </h1>
                  <ul className="list-unstyled mt-3 mb-4">
                    <li className="border-bottom pb-2">✔ {plan.users}</li>
                    <li className="border-bottom pb-2">✔ {plan.storage}</li>
                    <li className="border-bottom pb-2">✔ {plan.support}</li>
                    <li className="border-bottom pb-2">✔ {plan.storage}</li>
                    <li className="border-bottom pb-2">✔ {plan.users}</li>
                    <li className="border-bottom pb-2">✔ {plan.support}</li>
                  </ul>
                  <button
                    type="button"
                    className={`w-100 btn btn-lg ${
                      plan.recommended
                        ? "btn-warning text-dark"
                        : "btn-outline-warning"
                    }`}
                  >
                    {plan.btnText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className=" text-secondary px-4 py-5 text-start"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/free-vector/golden-dust-elements-falling-down_260559-287.jpg?t=st=1742650392~exp=1742653992~hmac=2184d08f7e27b19303651c81e97d37fc10f6e29078b1d3bd63b2e37c8a69e240&w=1060')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed", // Helps maintain sharpness
          imageRendering: "crisp-edges", // Helps with pixelation
        }}
      >
        <h2 className="pb-2 border-bottom text-warning">Profit Calculator</h2>
        <p className="fw-semibold text-white">
          You must know the calculation before investing in any plan, so you
          never make mistakes.
          <br />
          Check the calculation and you will get as our calculator says.
        </p>
        <div
          style={{
            margin: "20px auto",
            textAlign: "center",
            padding: "20px",
            border: "1px solid #ffd700",
            borderRadius: "10px",
            backgroundColor: "#1a1a1a",
            color: "#ffd700",
            boxShadow: "0 0 15px #ffd700",
          }}
        >
          <div
            style={{ display: "flex", gap: "15px", justifyContent: "center" }}
          >
            {/* Select Field */}
            <div style={{ textAlign: "left", width: "50%" }}>
              <label
                htmlFor="plan-selector"
                style={{
                  color: "white",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Choose Plan
              </label>
              <select
                id="plan-selector"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                style={{
                  padding: "8px",
                  width: "100%",
                  backgroundColor: "#333",
                  color: "#ffd700",
                  border: "1px solid #ffd700",
                }}
              >
                <option value="">Select a plan</option>
                <option value="Basic">Basic - 5% Profit</option>
                <option value="Premium">Premium - 10% Profit</option>
                <option value="Gold">Gold - 15% Profit</option>
              </select>
            </div>

            {/* Input Field */}
            {plan && (
              <div style={{ textAlign: "left", width: "50%" }}>
                <label
                  htmlFor="plan-amount"
                  style={{
                    color: "white",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Investment
                </label>
                <input
                  id="plan-amount"
                  type="number"
                  value={planAmounts[plan]}
                  readOnly
                  style={{
                    padding: "8px",
                    width: "100%",
                    backgroundColor: "#333",
                    color: "#ffd700",
                    border: "1px solid #ffd700",
                  }}
                />
              </div>
            )}
          </div>

          {plan && (
            <>
              <p style={{ marginTop: "10px", color: "#ffd700" }}>
                Estimated Profit: <strong>${getProfit()}</strong>
              </p>
              <p style={{ marginTop: "5px", color: "white" }}>
                <em>{planMessages[plan]}</em>
              </p>
            </>
          )}
        </div>
      </div>
      <div className=" text-secondary px-4 py-5 text-start">
        <h2 className="pb-2 border-bottom text-warning">
          Frequently Asked Questions
        </h2>
        <p className="fw-semibold text-white">
          We answer some of your Frequently Asked Questions regarding our
          platform. If you
          <br></br>have a query that is not answered here, Please contact us.
        </p>
        <ul
          style={{
            listStyleType: "none",
            padding: "0",
            textAlign: "left",
            color: "#ffd700",
          }}
        >
          {faqs.map((faq, index) => (
            <div key={index} style={{ marginBottom: "10px", width: "100%" }}>
              <li
                style={{
                  cursor: "pointer",
                  padding: "15px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  border: "1px solid #ffd700",
                  borderRadius: "5px",
                  backgroundColor: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px", // Space between icon and text
                }}
                onClick={() => toggleFAQ(index)}
              >
                <i
                  className="bi bi-question-circle-fill"
                  style={{ color: "#ffd700" }}
                ></i>
                {faq.question}
              </li>
              {expandedQuestion === index && (
                <div
                  style={{
                    marginTop: "5px",
                    padding: "15px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    border: "1px solid #ffd700",
                    borderRadius: "5px",
                    backgroundColor: "#444",
                  }}
                >
                  <p style={{ color: "white", margin: 0, fontSize: "medium" }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </ul>
      </div>
      <div className="px-4 py-5 text-center position-relative">
        <h2 className="pb-2 border-bottom text-warning">
          Our Latest Transactions
        </h2>
        <p className="fw-semibold text-white">
          Here is the log of the most recent transactions including withdraw and
          deposit made by our users.
        </p>
        <div className="mb-3">
          <button
            onClick={() => {
              setActiveTab("deposit");
              setVisibleIndex(0);
            }}
            className={`btn me-2 ${
              activeTab === "deposit" ? "btn-warning" : "btn-outline-light"
            }`}
          >
            Latest Deposit
          </button>
          <button
            onClick={() => {
              setActiveTab("withdraw");
              setVisibleIndex(0);
            }}
            className={`btn ${
              activeTab === "withdraw" ? "btn-warning" : "btn-outline-light"
            }`}
          >
            Latest Withdraw
          </button>
        </div>
        <div className="table-responsive">
          <motion.table
            className="table text-center"
            style={{
              background: "transparent",
              borderBottom: "2px solid #ffc107",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <thead
              style={{
                background: "transparent",
                color: "#ffc107",
                borderBottom: "2px solid #ffc107",
              }}
            >
              <tr>
                <th style={{ background: "transparent", color: "#ffc107" }}>
                  Name
                </th>
                <th style={{ background: "transparent", color: "#ffc107" }}>
                  Date
                </th>
                <th style={{ background: "transparent", color: "#ffc107" }}>
                  Amount
                </th>
                <th style={{ background: "transparent", color: "#ffc107" }}>
                  Gateway
                </th>
              </tr>
            </thead>
            <motion.tbody
              key={visibleIndex}
              initial={{ opacity: 0, y: 10, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7 }}
            >
              {visibleData.map((row, index) => (
                <motion.tr
                  key={index}
                  style={{ background: "transparent", color: "#ffc107" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <td style={{ background: "transparent", color: "#ffc107" }}>
                    {row.name}
                  </td>
                  <td style={{ background: "transparent", color: "#ffc107" }}>
                    {row.date}
                  </td>
                  <td style={{ background: "transparent", color: "#ffc107" }}>
                    {row.amount}
                  </td>
                  <td style={{ background: "transparent", color: "#ffc107" }}>
                    {row.gateway}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </motion.table>
        </div>
      </div>
      <div className=" text-secondary px-4 py-5 text-start">
        <h2 className="pb-2 border-bottom text-warning">Our Top Investors</h2>
        <p className="fw-semibold text-white">
          Here are the investor leaders who have made the maximum investment{" "}
          <br></br>with our system.
        </p>
        <div className="row row-cols-1 row-cols-md-4 g-4">
          {users.map((user, index) => (
            <div className="col" key={index}>
              <div className="card text-white  h-100 hover-effect position-relative">
                <div className="golden-shape"></div>
                <div className="card-body text-left position-relative">
                  <h5 className="ranking text-gold position-absolute top-0 end-0 m-3 hover-effect">
                    #{user.ranking}
                  </h5>
                  <h5 className="card-title">{user.name}</h5>
                  <p className="card-text">{user.username}</p>
                  <p className="investment">
                    Investment: <strong>{user.investment}</strong>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className=" px-4 py-5 text-center position-relative">
        <h2 className="pb-2 border-bottom text-warning">Payment We Accept</h2>
        <p className="fw-semibold text-white">
          We accept all major cryptocurrencies and fiat payment methods to make
          your <br></br>investment process easier with our platform.
        </p>
        <Marquee pauseOnHover={true} speed={50}>
          <img
            src="https://img.icons8.com/color/96/visa.png"
            alt="Visa"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/mastercard.png"
            alt="Mastercard"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/paypal.png"
            alt="PayPal"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/apple-pay.png"
            alt="Apple Pay"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/google-pay.png"
            alt="Google Pay"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/phone-pe.png"
            alt="American Express"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/discover.png"
            alt="Discover"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/stripe.png"
            alt="Stripe"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/diners-club.png"
            alt="Diners Club"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/jcb.png"
            alt="JCB"
            className="payment-icon mx-3"
          />
          <img
            src="https://img.icons8.com/color/96/amex.png"
            alt="AMEX"
            className="payment-icon mx-3"
          />
        </Marquee>
      </div>
      <div className="px-4 py-5 text-center position-relative">
        <h2 className="pb-2 border-bottom text-warning">User Ranking</h2>
        <p className="fw-semibold text-white">
          Track your progress and rank up for exclusive rewards!
        </p>

        <RankingList />
      </div>

      <Footer />
      <LiveChat />
    </div>
  );
};

export default Home;
