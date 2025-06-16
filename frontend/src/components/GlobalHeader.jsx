"use client";

import { useAuth } from '@/contexts/AuthContext';
import styles from './styles/globalHeader.module.css';

export default function GlobalHeader() {
  const { user } = useAuth();

  const getHeaderColor = () => {
    switch (user?.role) {
      case 'user':
        return '#4B6E40';
      case 'teacher':
        return '#A18036';
      case 'admin':
        return '#AA553B';
      default:
        return '#3c8d66';
    }
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${getHeaderColor()} 0%, ${getHeaderColor()} 100%)`,
  };

  return (
    <div className={styles.globalHeader} style={headerStyle}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <img 
            src="/oci-velas.svg" 
            alt="OCI Velas" 
            className={styles.logo}
          />
          <h1 className={styles.title}>
            OLIMPÍADA CEARENSE DE INFORMÁTICA
          </h1>
        </div>
      </div>
    </div>
  );
}