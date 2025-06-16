"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import GabaritoDisplay from '@/components/GabaritoDisplay';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import styles from '@/components/styles/dashboard.module.css';

function LeiturasContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();
  
  const [leituras, setLeituras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    id_prova: '',
    id_participante: '',
    erro: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingLeitura, setEditingLeitura] = useState(null);
  const [formData, setFormData] = useState({
    id_prova: '',
    id_participante: '',
    gabarito: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [provas, setProvas] = useState([]);
  const [participantes, setParticipantes] = useState([]);

  useEffect(() => {
    loadLeituras();
    loadProvas();
    loadParticipantes();
  }, [pagination.page, filters]);

  useEffect(() => {
    if (editId) {
      const leitura = leituras.find(l => l.id === parseInt(editId));
      if (leitura) {
        handleEdit(leitura);
      }
    }
  }, [editId, leituras]);

  const loadLeituras = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      
      const response = await apiService.getLeituras(params);
      setLeituras(response.data.leituras);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error('Erro ao carregar leituras:', error);
      alert('Erro ao carregar leituras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProvas = async () => {
    try {
      const response = await apiService.getProvas();
      setProvas(response.data.provas);
    } catch (error) {
      console.error('Erro ao carregar provas:', error);
    }
  };

  const loadParticipantes = async () => {
    try {
      const response = await apiService.getParticipantes({ limit: 1000 });
      setParticipantes(response.data.participantes);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar gabarito
    const gabaritoRegex = /^[a-eA-EX\-]{20}$/;
    if (!gabaritoRegex.test(formData.gabarito)) {
      alert('O gabarito deve conter exatamente 20 caracteres (a-e, X para erro, - para vazio)');
      return;
    }
    
    try {
      const dataToSend = {
        ...formData,
        id_prova: parseInt(formData.id_prova),
        id_participante: parseInt(formData.id_participante),
      };
      
      await apiService.updateLeitura(editingLeitura.id, dataToSend);
      
      setShowModal(false);
      setEditingLeitura(null);
      setFormData({ id_prova: '', id_participante: '', gabarito: '' });
      loadLeituras();
    } catch (error) {
      console.error('Erro ao salvar leitura:', error);
      alert('Erro ao salvar leitura: ' + error.message);
    }
  };

  const handleEdit = (leitura) => {
    setEditingLeitura(leitura);
    setFormData({
      id_prova: leitura.id_prova.toString(),
      id_participante: leitura.id_participante.toString(),
      gabarito: leitura.gabarito,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta leitura?')) return;
    
    try {
      await apiService.deleteLeitura(id);
      loadLeituras();
    } catch (error) {
      console.error('Erro ao excluir leitura:', error);
      alert('Erro ao excluir leitura: ' + error.message);
    }
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

  const formatNota = (nota) => {
    const num = parseFloat(nota);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatGabarito = (gabaritoAluno, gabaritoCorreto, userRole) => {
    if (!gabaritoAluno) return null;
    
    // Se não for teacher ou admin, ou não tiver gabarito correto, usar formatação simples
    if (userRole === 'user' || !gabaritoCorreto) {
      return gabaritoAluno.split('').map((char, index) => (
        <span 
          key={index}
          style={{
            color: char === 'X' || char === '-' ? '#dc2626' : '#16a34a',
            fontWeight: char === 'X' || char === '-' ? 'bold' : 'normal',
            marginRight: '0.1em',
          }}
        >
          {char.toUpperCase()}
        </span>
      ));
    }
    
    // Para teacher e admin, comparar com gabarito correto
    return gabaritoAluno.split('').map((char, index) => {
      const charCorreto = gabaritoCorreto[index];
      let cor = '#6b7280'; // cinza padrão
      
      // Determinar a cor baseada na comparação
      if (char === 'X' || char === '-' || char === '?') {
        // Erro de leitura - amarelo
        cor = '#f59e0b';
      } else if (char === charCorreto) {
        // Resposta correta - verde
        cor = '#16a34a';
      } else if (char >= 'a' && char <= 'e') {
        // Resposta válida mas incorreta - vermelho
        cor = '#dc2626';
      }
      
      return (
        <span 
          key={index}
          style={{
            color: cor,
            fontWeight: '600',
            marginRight: '0.1em',
          }}
        >
          {char.toUpperCase()}
        </span>
      );
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Leituras">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Leituras Realizadas</h2>
          </div>

          {/* Filtros */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
          }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Filtrar por Prova</label>
              <select
                value={filters.id_prova}
                onChange={(e) => setFilters(prev => ({ ...prev, id_prova: e.target.value }))}
                className={styles.formInput}
              >
                <option value="">Todas as provas</option>
                {provas.map(prova => (
                  <option key={prova.id} value={prova.id}>
                    Prova {prova.id}
                  </option>
                ))}
              </select>
            </div>
            
            {user?.role !== 'user' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Filtrar por Participante</label>
                <select
                  value={filters.id_participante}
                  onChange={(e) => setFilters(prev => ({ ...prev, id_participante: e.target.value }))}
                  className={styles.formInput}
                >
                  <option value="">Todos os participantes</option>
                  {participantes.map(participante => (
                    <option key={participante.id} value={participante.id}>
                      {participante.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Filtrar por Status</label>
              <select
                value={filters.erro}
                onChange={(e) => setFilters(prev => ({ ...prev, erro: e.target.value }))}
                className={styles.formInput}
              >
                <option value="">Todos os status</option>
                <option value="0">Sem erro</option>
                <option value="1">Erro no código Aztec</option>
                <option value="2">Imprecisão na leitura</option>
                <option value="3">Erro fatal</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Arquivo</th>
                      <th>Participante</th>
                      <th>Prova</th>
                      <th>Gabarito</th>
                      <th>Acertos</th>
                      <th>Nota</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leituras.map((leitura) => (
                      <tr key={leitura.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {leitura.erro === 0 ? (
                              <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                            ) : (
                              <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
                            )}
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: leitura.erro === 0 ? '#16a34a' : '#dc2626',
                            }}>
                              {getErrorMessage(leitura.erro)}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {leitura.arquivo.split('/').pop()}
                        </td>
                        <td>
                          {leitura.participante?.nome || `ID: ${leitura.id_participante}`}
                          {leitura.participante?.escola && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {leitura.participante.escola}
                            </div>
                          )}
                        </td>
                        <td>Prova {leitura.id_prova}</td>
                        <td>
                          <GabaritoDisplay 
                            gabarito={leitura.gabarito}
                            gabaritoCorreto={leitura.prova?.gabarito}
                            showComparison={user?.role !== 'user'}
                            size="small"
                          />
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>
                          {leitura.acertos}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600', fontSize: '1rem' }}>
                          {formatNota(leitura.nota)}
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {formatDate(leitura.created_at)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEdit(leitura)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                color: 'var(--primary)',
                              }}
                              title="Editar leitura"
                            >
                              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                            </button>
                            <button
                              onClick={() => handleDelete(leitura.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                color: '#dc2626',
                              }}
                              title="Excluir leitura"
                            >
                              <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  marginTop: '1.5rem' 
                }}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className={`${styles.button} ${styles.buttonOutline}`}
                    style={{ opacity: pagination.page === 1 ? 0.5 : 1 }}
                  >
                    Anterior
                  </button>
                  <span style={{ color: 'var(--background)' }}>
                    Página {pagination.page} de {pagination.pages} ({pagination.total} total)
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className={`${styles.button} ${styles.buttonOutline}`}
                    style={{ opacity: pagination.page === pagination.pages ? 0.5 : 1 }}
                  >
                    Próxima
                  </button>
                </div>
              )}

              {/* Legenda para teachers e admins */}
              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <strong style={{ color: '#000000' }}>Legenda do Gabarito:</strong> 
                  <span style={{ color: '#16a34a', fontWeight: '600', marginLeft: '0.5rem' }}>Verde = Correto</span>
                  <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '1rem' }}>Vermelho = Incorreto</span>
                  <span style={{ color: '#f59e0b', fontWeight: '600', marginLeft: '1rem' }}>Amarelo = Erro de leitura</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de Edição */}
        {showModal && editingLeitura && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '100%',
              maxWidth: '600px',
              margin: '1rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--background)' }}>
                Editar Leitura
              </h3>
              
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem' 
              }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                  <strong>Arquivo:</strong> {editingLeitura.arquivo.split('/').pop()}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                  <strong>Status Original:</strong> {getErrorMessage(editingLeitura.erro)}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  <strong>Gabarito Original:</strong> 
                  <span style={{ fontFamily: 'monospace', marginLeft: '0.5rem' }}>
                    {formatGabarito(editingLeitura.gabarito, editingLeitura.prova?.gabarito, user?.role)}
                  </span>
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prova</label>
                  <select
                    value={formData.id_prova}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_prova: e.target.value }))}
                    className={styles.formInput}
                    required
                  >
                    <option value="">Selecione uma prova</option>
                    {provas.map(prova => (
                      <option key={prova.id} value={prova.id}>
                        Prova {prova.id} - {prova.gabarito}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Participante</label>
                  <select
                    value={formData.id_participante}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_participante: e.target.value }))}
                    className={styles.formInput}
                    required
                  >
                    <option value="">Selecione um participante</option>
                    {participantes.map(participante => (
                      <option key={participante.id} value={participante.id}>
                        {participante.nome} - {participante.escola}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Gabarito Corrigido (20 caracteres: a-e, X para erro, - para vazio)
                  </label>
                  <input
                    type="text"
                    value={formData.gabarito}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      gabarito: e.target.value.toLowerCase().replace(/[^a-ex\-]/g, '').slice(0, 20)
                    }))}
                    className={styles.formInput}
                    maxLength={20}
                    style={{ 
                      fontFamily: 'monospace', 
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    {formData.gabarito.length}/20 caracteres
                  </small>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`${styles.button} ${styles.buttonOutline}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function LeiturasPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout currentPage="Leituras">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <LeiturasContent />
    </Suspense>
  );
}