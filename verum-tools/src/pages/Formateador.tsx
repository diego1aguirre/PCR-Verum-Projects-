import { AlignLeft } from 'lucide-react';

export function Formateador() {
  return (
    <div className="page">
      <h1 className="page-title">Formateador</h1>
      <p className="page-subtitle">Formatea y transforma texto con facilidad.</p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlignLeft size={20} color="#F48220" />
          <span style={{ fontWeight: 600, color: '#231F20' }}>Editor de texto</span>
        </div>
        <p style={{ color: '#808184', fontSize: 13, lineHeight: 1.6 }}>
          Esta sección está en construcción. Aquí podrás pegar texto sin formato y
          aplicar estilos, correcciones y transformaciones automáticas.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">Formatear</button>
          <button className="btn btn-secondary">Limpiar</button>
        </div>
      </div>
    </div>
  );
}
