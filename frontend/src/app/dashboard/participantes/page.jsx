"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import apiService from '@/services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import styles from '@/components/styles/dashboard.module.css';

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState(null);
  const [formData, setFormData] = useState({ nome: '', escola: '' });
  const [csvData, setCsvData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  useEffect(() => {
    loadParticipantes();
  }, [pagination.page, searchTerm]);

  const loadParticipantes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await apiService.getParticipantes(params);
      setParticipantes(response.data.participantes);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      alert('Erro ao carregar participantes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParticipante) {
        await apiService.updateParticipante(editingParticipante.id, formData);
      } else {
        await apiService.createParticipante(formData);
      }
      
      setShowModal(false);
      setEditingParticipante(null);
      setFormData({ nome: '', escola: '' });
      loadParticipantes();
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
      alert('Erro ao salvar participante: ' + error.message);
    }
  };

  const handleEdit = (participante) => {
    setEditingParticipante(participante);
    setFormData({ nome: participante.nome, escola: participante.escola });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este participante?')) return;
    
    try {
      await apiService.deleteParticipante(id);
      loadParticipantes();
    } catch (error) {
      console.error('Erro ao excluir participante:', error);
      alert('Erro ao excluir participante: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      alert('Por favor, insira os dados CSV');
      return;
    }
    
    try {
      const response = await apiService.importParticipantes(csvData);
      alert(`Importação concluída: ${response.resultado.importados} importados, ${response.resultado.atualizados} atualizados`);
      setShowImportModal(false);
      setCsvData('');
      loadParticipantes();
    } catch (error) {
      console.error('Erro ao importar participantes:', error);
      alert('Erro ao importar participantes: ' + error.message);
    }
  };

  const filteredParticipantes = participantes.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.escola.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Participantes">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Gerenciar Participantes</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowImportModal(true)}
                className={`${styles.button} ${styles.buttonOutline}`}
              >
                <DocumentArrowUpIcon className={styles.icon} />
                Importar CSV
              </button>
              <button
                onClick={() => {
                  setEditingParticipante(null);
                  setFormData({ nome: '', escola: '' });
                  setShowModal(true);
                }}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <PlusIcon className={styles.icon} />
                Novo Participante
              </button>
            </div>
          </div>

          {/* Busca */}
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <MagnifyingGlassIcon 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                width: '1.25rem', 
                height: '1.25rem', 
                color: '#9ca3af' 
              }} 
            />
            <input
              type="text"
              placeholder="Buscar por nome ou escola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.formInput}
              style={{ paddingLeft: '3rem' }}
            />
          </div>

          {/* Tabela */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Escola</th>
                    <th>Data de Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipantes.map((participante) => (
                    <tr key={participante.id}>
                      <td>{participante.id}</td>
                      <td>{participante.nome}</td>
                      <td>{participante.escola}</td>
                      <td>{new Date(participante.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(participante)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              color: 'var(--primary)',
                            }}
                          >
                            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(participante.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              color: '#dc2626',
                            }}
                          >
                            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
                    Página {pagination.page} de {pagination.pages}
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
            </>
          )}
        </div>

        {/* Modal de Edição/Criação */}
        {showModal && (
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
              maxWidth: '500px',
              margin: '1rem',
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--background)' }}>
                {editingParticipante ? 'Editar Participante' : 'Novo Participante'}
              </h3>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Escola</label>
                  <input
                    type="text"
                    value={formData.escola}
                    onChange={(e) => setFormData(prev => ({ ...prev, escola: e.target.value }))}
                    className={styles.formInput}
                    required
                  />
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
                    {editingParticipante ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Importação */}
        {showImportModal && (
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
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--background)' }}>
                Importar Participantes via CSV
              </h3>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Dados CSV (formato: id,nome,escola)
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className={styles.formTextarea}
                  placeholder="id,nome,escola&#10;1,Ana Clara Silva,Escola Nova&#10;2,João Pedro Santos,Escola Nova"
                  rows={10}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowImportModal(false)}
                  className={`${styles.button} ${styles.buttonOutline}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Importar
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}