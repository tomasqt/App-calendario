function formatMoneda(monto, moneda) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda || "ARS" }).format(monto);
}

export default function PendingPayments({ pagos }) {
  if (pagos.length === 0) {
    return <p className="pending-payments__empty">No tenés cobros pendientes. 🎉</p>;
  }

  const total = pagos.reduce((acc, p) => acc + p.monto, 0);

  return (
    <div className="pending-payments">
      <div className="pending-payments__total">
        Total pendiente: <strong>{formatMoneda(total, pagos[0]?.moneda)}</strong>
      </div>
      <table className="pending-payments__table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Días pendiente</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.id} className={p.diasPendiente >= 10 ? "pending-payments__row--overdue" : ""}>
              <td>{p.cliente}</td>
              <td>{formatMoneda(p.monto, p.moneda)}</td>
              <td>{p.diasPendiente}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
