import { AuthProvider } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}