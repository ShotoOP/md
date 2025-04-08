import React from "react";
import { BiCollection, BiCog, BiTachometer, BiTable, BiShield, BiTrendingUp, BiSupport, BiGlobe } from "react-icons/bi";

function Services() {
  const servicesData = [
    {
      title: "Our Core Services",
      description: "We offer a range of high-quality services tailored to meet your business needs.",
      features: [
        { icon: <BiCollection size={30} color="gold" />, title: "Data Management", text: "Streamline your data with our expert solutions." },
        { icon: <BiCog size={30} color="gold" />, title: "Custom Development", text: "Bespoke software built to your specifications." },
        { icon: <BiTachometer size={30} color="gold" />, title: "Performance Optimization", text: "Enhancing efficiency and speed across platforms." },
        { icon: <BiTable size={30} color="gold" />, title: "Analytics & Reporting", text: "Gain insights with advanced data analytics." },
      ],
    },
    {
      title: "Security & Compliance",
      description: "Ensure your systems are secure and compliant with the latest regulations.",
      features: [
        { icon: <BiShield size={30} color="gold" />, title: "Cybersecurity", text: "Protect your business from digital threats." },
        { icon: <BiGlobe size={30} color="gold" />, title: "Network Security", text: "Secure your communication channels." },
        { icon: <BiTrendingUp size={30} color="gold" />, title: "Risk Management", text: "Identify and mitigate potential risks." },
        { icon: <BiSupport size={30} color="gold" />, title: "24/7 Support", text: "Assistance whenever you need it." },
      ],
    },
  ];

  return (
    <div>
      {servicesData.map((service, index) => (
        <div className="bg-dark px-4 py-5 text-start" key={index}>
          <h2 className="pb-2 border-bottom text-warning">{service.title}</h2>
          <div className="row row-cols-1 row-cols-md-2 align-items-md-center g-5 py-5">
            <div className="col d-flex flex-column align-items-start gap-2">
              <h2 className="fw-bold text-warning">{service.title}</h2>
              <p className="text-white">{service.description}</p>
              <button type="button" className="btn btn-warning btn-lg px-4 me-sm-3 fw-bold">
                More Services
              </button>
            </div>

            <div className="col">
              <div className="row row-cols-1 row-cols-sm-2 g-4">
                {service.features.map((feature, featureIndex) => (
                  <div className="col d-flex flex-column gap-2" key={featureIndex}>
                    <div className="feature-icon-small d-inline-flex fs-4 rounded-3">{feature.icon}</div>
                    <h4 className="fw-semibold mb-0 text-warning">{feature.title}</h4>
                    <p className="text-white">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Services;
