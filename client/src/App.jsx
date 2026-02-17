import { Routes, Route } from "react-router-dom";
import TablePage from "./pages/TablePage";
import WaiterPage from "./pages/WaiterPage";
import TablesDemoPage from "./pages/TablesDemoPage";
import WaiterPersonalPage from "./pages/WaiterPersonalPage";
import PickWaiter from "./pages/PickWaiter";




export default function App() {
  return (
    <Routes>
      <Route path="/t/:tableId" element={<TablePage />} />
      <Route path="/waiter" element={<WaiterPage />} />
      <Route path="/demo/tables" element={<TablesDemoPage />} />
      <Route path="/w/:waiterId" element={<WaiterPersonalPage />} />
      <Route path="/pick-waiter" element={<PickWaiter />} />
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
        Kaki MMA samo bareknuckle gole šake!
      </h1>

      <img
        src="/images/mma.jpg"
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
