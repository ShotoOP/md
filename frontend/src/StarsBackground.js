import React, { useEffect, useRef } from "react";
import "./StarsBackground.css";

const StarsBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let stars = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createStars();
    };

    const createStars = () => {
      stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 1,
        opacity: Math.random(),
        flickerSpeed: Math.random() * 0.02 + 0.01,
      }));
    };

    const updateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.opacity += star.flickerSpeed;
        if (star.opacity >= 1 || star.opacity <= 0.3) {
          star.flickerSpeed *= -1;
        }

        star.y -= star.speed;
        if (star.y < 0) star.y = canvas.height;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${star.opacity})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.fill();
      });

      requestAnimationFrame(updateStars);
    };

    resizeCanvas();
    updateStars();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return <canvas ref={canvasRef} className="stars-canvas"></canvas>;
};

export default StarsBackground;
