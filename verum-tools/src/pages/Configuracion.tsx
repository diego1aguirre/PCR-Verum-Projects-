import { Settings } from 'lucide-react';

export function Configuracion() {
  return (
    <div className="page">
      <h1 className="page-title">Configuración</h1>
      <p className="page-subtitle">Administra las preferencias de tu cuenta.</p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Settings size={20} color="#F48220" />
          <span style={{ fontWeight: 600, color: '#231F20' }}>Preferencias generales</span>
        </div>
        <p style={{ color: '#808184', fontSize: 13, lineHeight: 1.6 }}>
          Esta sección está en construcción. Aquí podrás ajustar el idioma,
          las notificaciones y otras opciones de tu cuenta Verum.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">Guardar cambios</button>
          <button className="btn btn-ghost">Restablecer</button>
        </div>
      </div>
    </div>
  );
}
