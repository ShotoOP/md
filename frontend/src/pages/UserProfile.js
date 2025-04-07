import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

const UserProfile = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implement logout functionality here
    console.log("User logged out");
    navigate("/login");
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        <img
          src={user.profilePicture}
          alt="User Profile"
          className="profile-picture"
        />
        <div className="user-details">
          <h5 className="user-name">{user.name}</h5>
          <p className="user-email">{user.email}</p>
        </div>
      </div>
      <button className="btn btn-outline-warning btn-sm" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
