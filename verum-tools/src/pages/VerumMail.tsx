import { Mail } from 'lucide-react';

export function VerumMail() {
  return (
    <div className="page">
      <h1 className="page-title">Verum Mail</h1>
      <p className="page-subtitle">Gestiona y envía correos desde esta herramienta.</p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Mail size={20} color="#F48220" />
          <span style={{ fontWeight: 600, color: '#231F20' }}>Bandeja de entrada</span>
        </div>
        <p style={{ color: '#808184', fontSize: 13, lineHeight: 1.6 }}>
          Esta sección está en construcción. Aquí podrás redactar, enviar y administrar
          correos electrónicos directamente desde la plataforma Verum.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">Nuevo correo</button>
          <button className="btn btn-ghost">Ver plantillas</button>
        </div>
      </div>
    </div>
  );
}
