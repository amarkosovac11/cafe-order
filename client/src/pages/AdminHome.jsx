import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { isAdminLoggedIn } from "../adminAuth";
import "../css/AdminHome.css";

export default function AdminHome() {
  const nav = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn()) nav("/admin");
  }, [nav]);

  return (
    <div className="adminHomePage">
      <div className="adminHomeWrap">
        <div className="adminHomeHeader">
          <div>
            <h1 className="adminHomeTitle">Hotel Operations</h1>
            <p className="adminHomeSubtitle">
              Manage rooms, staff activity, guest requests and room service.
            </p>
          </div>

          <Link className="adminHomeBtn" to="/waiter">
            Open Staff Dashboard
          </Link>
        </div>

        <div className="adminHomeGrid">
          <Link to="/admin/tables" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">🛏️</span>
              <span className="adminHomeCardTitle">See Rooms</span>
            </div>
            <div className="adminHomeCardDesc">
              View rooms and open guest room pages.
            </div>
          </Link>

          <Link to="/waiter" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">🛎️</span>
              <span className="adminHomeCardTitle">Staff Dashboard</span>
            </div>
            <div className="adminHomeCardDesc">
              Monitor room service orders and guest requests live.
            </div>
          </Link>

          <Link to="/admin/waiters" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">🧑‍💼</span>
              <span className="adminHomeCardTitle">Manage Staff</span>
            </div>
            <div className="adminHomeCardDesc">
              Add, disable or remove staff accounts.
            </div>
          </Link>

          <Link to="/admin/menu" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">🍽️</span>
              <span className="adminHomeCardTitle">Manage Room Service Menu</span>
            </div>
            <div className="adminHomeCardDesc">
              Edit categories, menu items and availability.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}