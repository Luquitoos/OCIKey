"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import {
  UserIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import styles from '@/components/styles/dashboard.module.css';

export default function ParticipantePage() {
  const { user, participante, loadParticipante } = useAuth();
  const [formData, setFormData] = useState({ nome: '', escola: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (participante) {
      setFormData({
        nome: participante.nome || '',
        escola: participante.escola || '',
      });
    }
  }, [participante]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (participante) {
        // Atualizar participante existente
        await apiService.updateParticipante(participante.id, formData);
        setMessage('Perfil atualizado com sucesso!');
      } else {
        // Criar novo participante
        await apiService.createParticipante(formData);
        setMessage('Perfil criado com sucesso!');
      }
      
      // Recarregar dados do participante
      await loadParticipante();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setError('Erro ao salvar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Participante">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Meu Perfil</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
              <span style={{ color: 'var(--background)', fontWeight: '600' }}>
                {participante ? 'Suas Informações' : 'Criar Perfil'}
              </span>
            </div>
          </div>

          {/* Mensagens */}
          {message && (
            <div className={styles.success}>
              <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              {message}
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Informações do Usuário */}
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '0.75rem', 
            marginBottom: '2rem' 
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--background)' }}>
              Informações da Conta
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                  Nome de Usuário:
                </p>
                <p style={{ margin: 0, color: 'var(--background)' }}>
                  {user?.username}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                  Email:
                </p>
                <p style={{ margin: 0, color: 'var(--background)' }}>
                  {user?.email}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                  Tipo de Conta:
                </p>
                <p style={{ margin: 0, color: 'var(--background)', textTransform: 'capitalize' }}>
                  {user?.role === 'user' ? 'Aluno' : user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de Perfil */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <UserIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                Nome Completo
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Digite seu nome completo"
                required
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Este nome aparecerá nos relatórios e resultados
              </small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <AcademicCapIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                Escola
              </label>
              <input
                type="text"
                name="escola"
                value={formData.escola}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Digite o nome da sua escola"
                required
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Nome da instituição de ensino onde você estuda
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.button} ${styles.buttonPrimary}`}
                style={{ opacity: loading ? 0.6 : 1, minWidth: '150px' }}
              >
                {loading ? 'Salvando...' : (participante ? 'Atualizar Perfil' : 'Criar Perfil')}
              </button>
            </div>
          </form>

          {/* Informações Adicionais */}
          {participante && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '0.75rem',
              border: '1px solid #bbf7d0'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#16a34a' }}>
                Perfil Ativo
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#15803d', margin: '0 0 0.25rem 0' }}>
                    ID do Participante:
                  </p>
                  <p style={{ margin: 0, color: '#16a34a', fontFamily: 'monospace' }}>
                    #{participante.id}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#15803d', margin: '0 0 0.25rem 0' }}>
                    Cadastrado em:
                  </p>
                  <p style={{ margin: 0, color: '#16a34a' }}>
                    {new Date(participante.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}