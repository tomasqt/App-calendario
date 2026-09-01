import { useEffect, useState } from "react";

import { api } from "./api.js";
import PendingPayments from "./components/PendingPayments.jsx";
import WeekCalendar from "./components/WeekCalendar.jsx";

export default function App() {
  const [eventos, setEventos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([api.getEvents(), api.getPayments()])
      .then(([eventosData, pagosData]) => {
        setEventos(eventosData);
        setPagos(pagosData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Calendario Freelancer</h1>
        <p className="app__subtitle">Organizá tu laburo sin salir de WhatsApp.</p>
      </header>

      {error && (
        <p className="app__error">
          No se pudo conectar con el backend ({error}). ¿Está corriendo <code>npm run dev</code> en{" "}
          <code>backend/</code>?
        </p>
      )}

      {cargando && !error && <p>Cargando...</p>}

      {!cargando && !error && (
        <>
          <section className="app__section">
            <h2>Tu semana</h2>
            <WeekCalendar eventos={eventos} />
          </section>

          <section className="app__section">
            <h2>Cobros pendientes</h2>
            <PendingPayments pagos={pagos} />
          </section>
        </>
      )}
    </div>
  );
}
