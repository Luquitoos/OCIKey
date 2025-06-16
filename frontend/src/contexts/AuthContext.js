"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '@/services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [participante, setParticipante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo ao carregar a aplicação
    const token = apiService.getToken();
    if (token) {
      // Recuperar dados do usuário do localStorage se disponível
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          // Tentar carregar dados do participante se for usuário
          if (parsedUser.role === 'user') {
            loadParticipante();
          }
        } catch (error) {
          console.error('Erro ao recuperar dados do usuário:', error);
          setUser({ token });
          loadParticipante();
        }
      } else {
        setUser({ token });
        loadParticipante();
      }
    }
    setLoading(false);
  }, []);

  const loadParticipante = async () => {
    try {
      const response = await apiService.getMeuPerfil();
      if (response.success) {
        setParticipante(response.data.participante);
      }
    } catch (error) {
      console.log('Usuário não tem participante associado');
      setParticipante(null);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        // Salvar dados do usuário no localStorage
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        // Carregar dados do participante se for usuário comum
        if (response.data.user.role === 'user') {
          await loadParticipante();
        }
        return { success: true, user: response.data.user };
      }
      return { success: false, message: response.message, errors: response.errors };
    } catch (error) {
      // Se o erro tem uma resposta da API, usar essa resposta
      if (error.response) {
        return { 
          success: false, 
          message: error.response.message || error.message,
          errors: error.response.errors || []
        };
      }
      return { success: false, message: error.message, errors: [] };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        setUser(response.data.user);
        // Salvar dados do usuário no localStorage
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        // Carregar dados do participante se for usuário comum
        if (response.data.user.role === 'user') {
          await loadParticipante();
        }
        return { success: true, user: response.data.user };
      }
      return { success: false, message: response.message, errors: response.errors };
    } catch (error) {
      // Se o erro tem uma resposta da API, usar essa resposta
      if (error.response) {
        return { 
          success: false, 
          message: error.response.message || error.message,
          errors: error.response.errors || []
        };
      }
      return { success: false, message: error.message, errors: [] };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setParticipante(null);
      // Limpar dados do localStorage
      localStorage.removeItem('userData');
    }
  };

  const value = {
    user,
    participante,
    login,
    register,
    logout,
    loading,
    loadParticipante,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}