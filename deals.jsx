import { useEffect, useState } from "react";
import axios from "axios";

export default function Deals({ venueId }) {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/venues/${venueId}/deals`)
      .then(res => setDeals(res.data));
  }, []);

  return (
    <div>
      {deals.map(d => (
        <div key={d.id} className="badge bg-success me-1 mb-1">
          {d.title}
        </div>
      ))}
    </div>
  );
}