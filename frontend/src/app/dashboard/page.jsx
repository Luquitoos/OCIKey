"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CameraIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import styles from '@/components/styles/dashboard.module.css';

export default function DashboardPage() {
  const { user, participante } = useAuth();
  const [stats, setStats] = useState({
    participantes: 0,
    provas: 0,
    leituras: 0,
    leiturasPendentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentLeituras, setRecentLeituras] = useState([]);
  const [provas, setProvas] = useState([]);
  const [selectedProva, setSelectedProva] = useState('');
  const [estatisticas, setEstatisticas] = useState(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'user') {
        // Para usuários comuns, carregar estatísticas pessoais
        const [provasRes, leiturasRes, estatisticasRes] = await Promise.all([
          apiService.getProvas(),
          apiService.getLeituras({ limit: 1000 }),
          apiService.getMinhasEstatisticas(),
        ]);

        const todasProvas = provasRes.data?.provas || [];
        
        // Usar a mesma lógica da sessão de provas para contar provas realizadas
        const leiturasDoUsuario = leiturasRes.data?.leituras || [];
        const provasPorId = {};
        
        // Agrupar leituras por prova e pegar a melhor leitura de cada prova
        leiturasDoUsuario.forEach(leitura => {
          const idProva = leitura.id_prova;
          
          if (!provasPorId[idProva]) {
            provasPorId[idProva] = leitura;
          } else {
            // Priorizar leitura com menor erro (erro menos grave)
            if (leitura.erro < provasPorId[idProva].erro) {
              provasPorId[idProva] = leitura;
            }
          }
        });
        
        // Criar array de provas realizadas com informações completas
        const minhasProvasRealizadas = Object.values(provasPorId).map(leitura => {
          const provaInfo = todasProvas.find(p => p.id === leitura.id_prova);
          return {
            ...leitura,
            prova: provaInfo
          };
        });
        
        // Ordenar por data mais recente
        minhasProvasRealizadas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        const provasRealizadas = minhasProvasRealizadas.length;
        
        // Definir as provas que o usuário pode selecionar (apenas as que ele fez)
        const provasParaSelecao = minhasProvasRealizadas.map(item => ({
          id: item.id_prova,
          gabarito: item.prova?.gabarito || '',
          created_at: item.created_at
        }));
        
        setProvas(provasParaSelecao);
        
        setStats({
          participantes: 1, // Sempre 1 para o próprio usuário
          provas: provasRealizadas,
          leituras: leiturasDoUsuario.length, // Usar o total real de leituras do usuário
          leiturasPendentes: leiturasDoUsuario.filter(l => l.erro > 0).length || 0,
        });

        setRecentLeituras(leiturasRes.data?.leituras || []);
        setEstatisticas(estatisticasRes.data);
        
        // Selecionar a prova mais recente automaticamente
        if (minhasProvasRealizadas.length > 0) {
          const provaMaisRecente = minhasProvasRealizadas[0];
          setSelectedProva(provaMaisRecente.id_prova.toString());
          // Carregar estatísticas da prova mais recente
          setTimeout(() => {
            loadEstatisticasProva(provaMaisRecente.id_prova.toString());
          }, 100);
        }
      } else {
        // Para admins/teachers, carregar estatísticas gerais
        const [participantesRes, provasRes, leiturasRecentesRes, todasLeiturasRes] = await Promise.all([
          apiService.getParticipantes({ limit: 1 }),
          apiService.getProvas(),
          apiService.getLeituras({ limit: 10 }), // Para leituras recentes
          apiService.getLeituras({ limit: 1000 }), // Para contar todas as leituras com erro
        ]);

        const todasLeituras = todasLeiturasRes.data?.leituras || [];

        setStats({
          participantes: participantesRes.data?.pagination?.total || 0,
          provas: provasRes.data?.provas?.length || 0,
          leituras: todasLeiturasRes.data?.pagination?.total || 0,
          leiturasPendentes: todasLeituras.filter(l => l.erro > 0).length || 0,
        });

        setRecentLeituras(leiturasRecentesRes.data?.leituras || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstatisticasProva = async (idProva) => {
    if (!idProva || user?.role !== 'user') return;
    
    try {
      const response = await apiService.getMinhasEstatisticas(idProva);
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas da prova:', error);
    }
  };

  useEffect(() => {
    if (selectedProva && user?.role === 'user') {
      loadEstatisticasProva(selectedProva);
    }
  }, [selectedProva, user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNota = (nota) => {
    const num = parseFloat(nota);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 0: return 'Sem erro';
      case 1: return 'Erro no código Aztec';
      case 2: return 'Imprecisão na leitura';
      case 3: return 'Erro fatal';
      default: return 'Erro desconhecido';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Dashboard">
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            <div className={styles.statsGrid}>
              {user?.role === 'user' ? (
                <>
                  {/* Card de Desempenho para usuários */}
                  <div className={styles.card} style={{ gridColumn: 'span 2' }}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>Meu Desempenho</h3>
                      <select
                        value={selectedProva}
                        onChange={(e) => setSelectedProva(e.target.value)}
                        className={styles.formInput}
                        style={{ width: 'auto', minWidth: '150px' }}
                      >
                        <option value="">Selecione uma prova</option>
                        {provas.map(prova => (
                          <option key={prova.id} value={prova.id}>
                            Prova {prova.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedProva ? (
                      estatisticas?.estatisticas_prova ? (
                      <div style={{ padding: '1rem 0' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--background)' }}>
                              Seu Desempenho: {estatisticas.estatisticas_prova.acertos}/{estatisticas.total_questoes} questões
                            </span>
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                              {estatisticas.estatisticas_prova.percentual.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ 
                            width: '100%', 
                            height: '20px', 
                            backgroundColor: '#e5e7eb', 
                            borderRadius: '10px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${estatisticas.estatisticas_prova.percentual}%`,
                              height: '100%',
                              backgroundColor: 'var(--primary)',
                              borderRadius: '10px',
                              transition: 'width 0.3s ease'
                            }}></div>
                            {estatisticas.media_geral && (
                              <div style={{
                                position: 'absolute',
                                left: `${estatisticas.media_geral.percentual_medio}%`,
                                top: '0',
                                width: '2px',
                                height: '100%',
                                backgroundColor: '#dc2626',
                                transform: 'translateX(-1px)'
                              }}></div>
                            )}
                          </div>
                          {estatisticas.media_geral && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                              <span style={{ color: '#6b7280' }}>
                                Média da turma: {estatisticas.media_geral.percentual_medio.toFixed(1)}%
                              </span>
                              <span style={{ color: '#dc2626' }}>
                                ← Linha vermelha = média
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                          <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                              {estatisticas.estatisticas_prova.acertos}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Acertos</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--background)', margin: 0 }}>
                              {formatNota(estatisticas.estatisticas_prova.nota)}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Nota</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6b7280', margin: 0 }}>
                              {estatisticas.total_questoes}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Questões</p>
                          </div>
                        </div>
                      </div>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                          <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                          </div>
                          <p style={{ marginTop: '1rem' }}>Carregando estatísticas...</p>
                        </div>
                      )
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        Selecione uma prova para ver seu desempenho
                      </div>
                    )}
                  </div>

                  {/* Cards de estatísticas gerais para usuários */}
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <AcademicCapIcon />
                    </div>
                    <div className={styles.statContent}>
                      <h3>{stats.provas}</h3>
                      <p>Provas Realizadas</p>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <DocumentTextIcon />
                    </div>
                    <div className={styles.statContent}>
                      <h3>{stats.leituras}</h3>
                      <p>Total de Leituras</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Cards para admins/teachers */}
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <UserGroupIcon />
                    </div>
                    <div className={styles.statContent}>
                      <h3>{stats.participantes}</h3>
                      <p>Participantes</p>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <AcademicCapIcon />
                    </div>
                    <div className={styles.statContent}>
                      <h3>{stats.provas}</h3>
                      <p>Provas</p>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <DocumentTextIcon />
                    </div>
                    <div className={styles.statContent}>
                      <h3>{stats.leituras}</h3>
                      <p>Leituras Realizadas</p>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <CameraIcon />
                    </div>
                    <div className={styles.statContent}>
                      <h3>{stats.leiturasPendentes}</h3>
                      <p>Leituras com Erro</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Ações Rápidas</h2>
              </div>
              {user?.role === 'user' ? (
                <div className={`${styles.grid} ${styles.gridCols3}`}>
                  <a href="/dashboard/leitura" className={`${styles.button} ${styles.buttonPrimary}`}>
                    <CameraIcon className={styles.icon} />
                    Nova Leitura
                  </a>
                  <a href="/dashboard/participante" className={`${styles.button} ${styles.buttonSecondary}`}>
                    <UserIcon className={styles.icon} />
                    Participante
                  </a>
                  <a href="/dashboard/leituras" className={`${styles.button} ${styles.buttonOutline}`}>
                    <DocumentTextIcon className={styles.icon} />
                    Minhas Leituras
                  </a>
                </div>
              ) : (
                <div className={`${styles.grid} ${styles.gridCols4}`}>
                  <a href="/dashboard/leitura" className={`${styles.button} ${styles.buttonPrimary}`}>
                    <CameraIcon className={styles.icon} />
                    Nova Leitura
                  </a>
                  <a href="/dashboard/participantes" className={`${styles.button} ${styles.buttonSecondary}`}>
                    <UserGroupIcon className={styles.icon} />
                    Gerenciar Participantes
                  </a>
                  <a href="/dashboard/provas" className={`${styles.button} ${styles.buttonSecondary}`}>
                    <AcademicCapIcon className={styles.icon} />
                    Gerenciar Provas
                  </a>
                  <a href="/dashboard/leituras" className={`${styles.button} ${styles.buttonOutline}`}>
                    <DocumentTextIcon className={styles.icon} />
                    Ver Leituras
                  </a>
                </div>
              )}
            </div>

            {/* Leituras Recentes */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Leituras Recentes</h2>
                <a href="/dashboard/leituras" className={`${styles.button} ${styles.buttonOutline}`}>
                  Ver Todas
                </a>
              </div>
              {recentLeituras.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Arquivo</th>
                      <th>Participante</th>
                      <th>Prova</th>
                      <th>Acertos</th>
                      <th>Nota</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeituras.slice(0, 5).map((leitura) => (
                      <tr key={leitura.id}>
                        <td>{leitura.arquivo.split('/').pop()}</td>
                        <td>{leitura.participante?.nome || `ID: ${leitura.id_participante}`}</td>
                        <td>Prova {leitura.id_prova}</td>
                        <td>{leitura.acertos}</td>
                        <td>{formatNota(leitura.nota)}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: leitura.erro === 0 ? '#dcfce7' : '#fef2f2',
                            color: leitura.erro === 0 ? '#16a34a' : '#dc2626',
                          }}>
                            {getErrorMessage(leitura.erro)}
                          </span>
                        </td>
                        <td>{formatDate(leitura.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  Nenhuma leitura encontrada
                </p>
              )}
            </div>
          </>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}