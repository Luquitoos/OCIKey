"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import GlobalHeader from './GlobalHeader';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  CameraIcon,
  ChartBarIcon,
    ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import styles from './styles/dashboard.module.css';

const getNavigation = (userRole) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Leitura de Gabaritos', href: '/dashboard/leitura', icon: CameraIcon },
  ];

  if (userRole === 'user') {
    return [
      ...baseNavigation,
      { name: 'Participante', href: '/dashboard/participante', icon: UserIcon },
      { name: 'Provas', href: '/dashboard/provas', icon: AcademicCapIcon },
      { name: 'Leituras', href: '/dashboard/leituras', icon: DocumentTextIcon },
    ];
  }

  return [
    ...baseNavigation,
    { name: 'Participantes', href: '/dashboard/participantes', icon: UserGroupIcon },
    { name: 'Provas', href: '/dashboard/provas', icon: AcademicCapIcon },
    { name: 'Leituras', href: '/dashboard/leituras', icon: DocumentTextIcon },
    { name: 'Relatórios', href: '/dashboard/relatorios', icon: ChartBarIcon },
      ];
};

export default function DashboardLayout({ children, currentPage = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, participante, logout } = useAuth();
  const router = useRouter();

  const navigation = getNavigation(user?.role);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getDisplayName = () => {
    if (user?.role === 'user' && participante?.nome) {
      return participante.nome; // Nome completo
    }
    return user?.username || 'Usuário';
  };

  const getWelcomeMessage = () => {
    if (user?.role === 'user' && participante?.nome) {
      return `Bem-vindo(a), ${participante.nome.split(' ')[0]}`;
    }
    return `Bem-vindo, ${user?.username || 'Usuário'}`;
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'user':
        return 'Aluno';
      case 'teacher':
        return 'Professor';
      case 'admin':
        return 'Administrador';
      default:
        return 'Usuário';
    }
  };

  const getRoleColors = () => {
    switch (user?.role) {
      case 'user':
        return {
          '--header-bg': '#4B6E40',
          '--sidebar-bg': '#37522E',
          '--text-color': '#37522E',
          '--background-color': '#ECE8E3',
          '--button-white': 'rgba(255, 255, 255, 0.7)',
          '--button-participant': '#F3BF49',
          '--button-green': '#37522E',
          '--primary-darker': '#2D4225',
        };
      case 'teacher':
        return {
          '--header-bg': '#A18036',
          '--sidebar-bg': '#8B7135',
          '--text-color': '#000000',
          '--background-color': '#ECE8E3',
          '--button-white': 'rgba(255, 255, 255, 0.7)',
          '--button-green': '#F3BF49',
          '--primary-darker': '#6E592A',
        };
      case 'admin':
        return {
          '--header-bg': '#AA553B',
          '--sidebar-bg': '#9B4E37',
          '--text-color': '#000000',
          '--background-color': '#ECE8E3',
          '--button-white': 'rgba(255, 255, 255, 0.7)',
          '--button-green': '#9B4E37',
          '--primary-darker': '#80402D',
        };
      default:
        return {};
    }
  };

  return (
    <div className={styles.pageWrapper} style={getRoleColors()}>
      <GlobalHeader />
      <div className={styles.container}>
      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)}>
          <div className={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sidebarHeader}>
              <img src="/OCIKey_Logotype.svg" alt="OCIKey" className={styles.logo} />
              <button
                onClick={() => setSidebarOpen(false)}
                className={styles.closeSidebar}
              >
                <XMarkIcon className={styles.icon} />
              </button>
            </div>
            <nav className={styles.navigation}>
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${styles.navItem} ${currentPage === item.name ? styles.navItemActive : ''}`}
                >
                  <item.icon className={styles.navIcon} />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <img src="/OCIKey_Logotype.svg" alt="OCIKey" className={styles.logo} />
        </div>
        <nav className={styles.navigation}>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`${styles.navItem} ${currentPage === item.name ? styles.navItemActive : ''}`}
            >
              <item.icon className={styles.navIcon} />
              {item.name}
            </a>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{getDisplayName()}</p>
              <p className={styles.userRole}>{getRoleDisplayName(user?.role || 'user')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <ArrowRightOnRectangleIcon className={styles.navIcon} />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        <header className={styles.header}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={styles.menuButton}
          >
            <Bars3Icon className={styles.icon} />
          </button>
          <h1 className={styles.pageTitle}>{currentPage}</h1>
          <div className={styles.headerActions}>
            <span className={styles.welcomeText}>
              {getWelcomeMessage()}
            </span>
          </div>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
      </div>
    </div>
  );
}