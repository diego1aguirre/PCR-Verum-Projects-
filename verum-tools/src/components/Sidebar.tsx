import type { ReactNode, CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, AlignLeft, FilePlus2, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

const tools = [
  { to: '/verum-mail', label: 'Verum Mail', icon: Mail },
  { to: '/formateador', label: 'Formateador', icon: AlignLeft },
  { to: '/merge-pdf', label: 'Merge PDF', icon: FilePlus2 },
];

const settings = [
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

const USER = { name: 'Diego Aguirre', initials: 'DA' };

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoWrap}>
        <img
          src="https://pcrverum.mx/wp-content/uploads/2021/08/logo.cliente.png"
          alt="PCR Verum"
          className={styles.logo}
        />
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <SectionLabel>HERRAMIENTAS</SectionLabel>
        {tools.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} icon={<Icon size={15} />}>
            {label}
          </NavItem>
        ))}

        <SectionLabel style={{ marginTop: '1.5rem' }}>AJUSTES</SectionLabel>
        {settings.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} icon={<Icon size={15} />}>
            {label}
          </NavItem>
        ))}
      </nav>

      {/* User */}
      <div className={styles.userRow}>
        <div className={styles.avatar}>{USER.initials}</div>
        <span className={styles.userName}>{USER.name}</span>
      </div>
    </aside>
  );
}

function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <p className={styles.sectionLabel} style={style}>
      {children}
    </p>
  );
}

function NavItem({
  to,
  icon,
  children,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.active : ''}`
      }
    >
      <span className={styles.navIcon}>{icon}</span>
      {children}
    </NavLink>
  );
}
