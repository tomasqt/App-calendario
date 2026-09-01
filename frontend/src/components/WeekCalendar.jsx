const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TIPO_COLOR = {
  reunion: "var(--color-reunion)",
  entrega: "var(--color-entrega)",
  cobro: "var(--color-cobro)",
};

/** Agrupa eventos por día de la semana (0=lunes .. 6=domingo) a partir de la fecha ISO. */
function agruparPorDia(eventos) {
  const grupos = Array.from({ length: 7 }, () => []);
  for (const ev of eventos) {
    const dia = (new Date(`${ev.fecha}T00:00:00`).getDay() + 6) % 7; // JS: 0=domingo
    grupos[dia].push(ev);
  }
  return grupos;
}

export default function WeekCalendar({ eventos }) {
  const grupos = agruparPorDia(eventos);

  return (
    <div className="week-calendar">
      {DIAS.map((dia, i) => (
        <div key={dia} className="week-calendar__day">
          <div className="week-calendar__day-label">{dia}</div>
          {grupos[i].length === 0 && <div className="week-calendar__empty">—</div>}
          {grupos[i].map((ev) => (
            <div
              key={ev.id}
              className="week-calendar__event"
              style={{ borderLeftColor: TIPO_COLOR[ev.tipo] || "var(--color-default)" }}
            >
              <span className="week-calendar__event-title">{ev.titulo}</span>
              {ev.hora && <span className="week-calendar__event-time">{ev.hora}</span>}
              {ev.cliente && <span className="week-calendar__event-client">{ev.cliente}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
