import { Routes, Route } from "react-router-dom";
import TablePage from "./pages/TablePage";
import WaiterPage from "./pages/WaiterPage";
import TablesDemoPage from "./pages/TablesDemoPage";


export default function App() {
  return (
    <Routes>
      <Route path="/t/:tableId" element={<TablePage />} />
      <Route path="/waiter" element={<WaiterPage />} />
      <Route path="/demo/tables" element={<TablesDemoPage />} />
      <Route path="*" element={<div>Kaki MMA samo bareknuckle gole šake!</div>} />
    </Routes>
  );
}
