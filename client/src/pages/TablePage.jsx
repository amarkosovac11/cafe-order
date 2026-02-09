import { useParams } from "react-router-dom";

export default function TablePage() {
  const { tableId } = useParams();

  return (
    <div style={{ padding: 24 }}>
      <h1>Table {tableId}</h1>
      <p>Menu will be here</p>
    </div>
  );
}
