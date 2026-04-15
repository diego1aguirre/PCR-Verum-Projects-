import { FilePlus2 } from 'lucide-react';

export function MergePDF() {
  return (
    <div className="page">
      <h1 className="page-title">Merge PDF</h1>
      <p className="page-subtitle">Combina múltiples archivos PDF en uno solo.</p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <FilePlus2 size={20} color="#F48220" />
          <span style={{ fontWeight: 600, color: '#231F20' }}>Unir archivos PDF</span>
        </div>
        <p style={{ color: '#808184', fontSize: 13, lineHeight: 1.6 }}>
          Esta sección está en construcción. Aquí podrás arrastrar y soltar varios
          archivos PDF para unirlos en un solo documento de forma rápida y sencilla.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">Seleccionar archivos</button>
          <button className="btn btn-ghost">Ver historial</button>
        </div>
      </div>
    </div>
  );
}
