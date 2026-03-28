import { Routes, Route } from "react-router-dom";
import TablePage from "./pages/TablePage";
import WaiterPage from "./pages/WaiterPage";
import TablesDemoPage from "./pages/TablesDemoPage";
import WaiterPersonalPage from "./pages/WaiterPersonalPage";
import PickWaiter from "./pages/PickWaiter";
import AdminWaitersPage from "./pages/AdminWaitersPage";
import AdminHome from "./pages/AdminHome";
import AdminLogin from "./pages/AdminLogin";
import AdminMenuPage from "./pages/AdminMenuPage";



export default function App() {
  return (
    <Routes>
      <Route path="/t/:tableId" element={<TablePage />} />
      <Route path="/waiter" element={<WaiterPage />} />
      <Route path="/admin/tables" element={<TablesDemoPage />} />
      <Route path="/w/:waiterId" element={<WaiterPersonalPage />} />
      <Route path="/pick-waiter" element={<PickWaiter />} />
      <Route path="/admin/waiters" element={<AdminWaitersPage />} />
      <Route path="/admin/home" element={<AdminHome />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/menu" element={<AdminMenuPage />} />

<Route
  path="*"
  element={
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <h1
        style={{
          fontSize: "56px",
          fontWeight: "900",
          marginBottom: "30px",
        }}
      >
{/*         Kaki MMA samo bareknuckle gole šake!
 */}      </h1>

      <img
        src="/images/bg.jpg"
        alt="MMA"
        style={{
          width: "80%",
          maxWidth: "900px",
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  }
/>
    </Routes>
  );
}
