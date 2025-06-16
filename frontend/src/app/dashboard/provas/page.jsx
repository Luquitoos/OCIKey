"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import GabaritoDisplay from '@/components/GabaritoDisplay';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import styles from '@/components/styles/dashboard.module.css';

export default function ProvasPage() {
  const { user } = useAuth();
  const [provas, setProvas] = useState([]);
  const [minhasProvas, setMinhasProvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProva, setEditingProva] = useState(null);
  const [formData, setFormData] = useState({ gabarito: '', peso_questao: 0.5 });
  const [csvData, setCsvData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [pesoQuestao, setPesoQuestao] = useState(0.5);

  useEffect(() => {
    if (user?.role === 'user') {
      loadMinhasProvas();
    } else {
      loadProvas();
    }
  }, [user]);

  const loadProvas = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProvas();
      setProvas(response.data.provas);
    } catch (error) {
      console.error('Erro ao carregar provas:', error);
      alert('Erro ao carregar provas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMinhasProvas = async () => {
    try {
      setLoading(true);
      
      // Carregar todas as leituras do usuário
      const leiturasResponse = await apiService.getLeituras({ limit: 1000 });
      const leituras = leiturasResponse.data?.leituras || [];
      
      // Carregar informações das provas
      const provasResponse = await apiService.getProvas();
      const todasProvas = provasResponse.data?.provas || [];
      
      // Agrupar leituras por prova e pegar a melhor leitura de cada prova
      const provasPorId = {};
      
      leituras.forEach(leitura => {
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
      
      // Criar array de provas com suas respectivas leituras
      const minhasProvasComLeituras = Object.values(provasPorId).map(leitura => {
        const provaInfo = todasProvas.find(p => p.id === leitura.id_prova);
        return {
          ...leitura,
          prova: provaInfo
        };
      });
      
      // Ordenar por ID da prova
      minhasProvasComLeituras.sort((a, b) => a.id_prova - b.id_prova);
      
      setMinhasProvas(minhasProvasComLeituras);
    } catch (error) {
      console.error('Erro ao carregar minhas provas:', error);
      alert('Erro ao carregar suas provas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar gabarito
    const gabaritoRegex = /^[a-eA-E]{20}$/;
    if (!gabaritoRegex.test(formData.gabarito)) {
      alert('O gabarito deve conter exatamente 20 caracteres (a-e)');
      return;
    }
    
    try {
      const dataToSend = {
        ...formData,
        gabarito: formData.gabarito.toLowerCase(),
      };
      
      if (editingProva) {
        await apiService.updateProva(editingProva.id, dataToSend);
      } else {
        await apiService.createProva(dataToSend);
      }
      
      setShowModal(false);
      setEditingProva(null);
      setFormData({ gabarito: '', peso_questao: 0.5 });
      loadProvas();
    } catch (error) {
      console.error('Erro ao salvar prova:', error);
      alert('Erro ao salvar prova: ' + error.message);
    }
  };

  const handleEdit = (prova) => {
    setEditingProva(prova);
    setFormData({ 
      gabarito: prova.gabarito, 
      peso_questao: prova.peso_questao 
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta prova?')) return;
    
    try {
      await apiService.deleteProva(id);
      loadProvas();
    } catch (error) {
      console.error('Erro ao excluir prova:', error);
      alert('Erro ao excluir prova: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      alert('Por favor, insira os dados CSV');
      return;
    }
    
    try {
      const response = await apiService.importProvas(csvData, pesoQuestao);
      alert(`Importação concluída: ${response.resultado.importadas} importadas, ${response.resultado.atualizadas} atualizadas`);
      setShowImportModal(false);
      setCsvData('');
      loadProvas();
    } catch (error) {
      console.error('Erro ao importar provas:', error);
      alert('Erro ao importar provas: ' + error.message);
    }
  };

  const formatGabarito = (gabarito) => {
    return gabarito.split('').map((char, index) => (
      <span key={index} style={{ marginRight: '0.25rem' }}>
        {char.toUpperCase()}
      </span>
    ));
  };

  const formatGabaritoComparativo = (gabaritoAluno, gabaritoCorreto) => {
    if (!gabaritoAluno || !gabaritoCorreto) return null;
    
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
            marginRight: '0.25rem',
            color: cor,
            fontWeight: '600',
            fontSize: '0.875rem'
          }}
        >
          {char.toUpperCase()}
        </span>
      );
    });
  };

  const renderMinhasProvas = () => {
    if (minhasProvas.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <AcademicCapIcon style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Nenhuma prova realizada
          </h3>
          <p>Você ainda não realizou nenhuma prova.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {minhasProvas.map((item) => {
          const totalQuestoes = item.prova?.gabarito?.length || 20;
          
          return (
            <div key={item.id_prova} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '3rem', 
                    height: '3rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700'
                  }}>
                    {item.id_prova}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--background)' }}>
                      Prova {item.id_prova}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {item.acertos}/{totalQuestoes} acertos • Nota: {parseFloat(item.nota).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.erro === 0 ? (
                    <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
                  ) : (
                    <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                  )}
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    color: item.erro === 0 ? '#16a34a' : '#f59e0b'
                  }}>
                    {item.erro === 0 ? 'Leitura OK' : `Erro ${item.erro}`}
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--background)' }}>
                    Suas Respostas:
                  </h4>
                  <GabaritoDisplay 
                    gabarito={item.gabarito}
                    gabaritoCorreto={item.prova?.gabarito}
                    showComparison={true}
                    size="medium"
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--background)' }}>
                    Gabarito Oficial:
                  </h4>
                  <GabaritoDisplay 
                    gabarito={item.prova?.gabarito}
                    size="medium"
                  />
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', margin: 0 }}>
                      {item.acertos}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Acertos</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626', margin: 0 }}>
                      {totalQuestoes - item.acertos}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Erros</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                      {((item.acertos / totalQuestoes) * 100).toFixed(1)}%
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Aproveitamento</p>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <strong style={{ color: '#000000' }}>Legenda:</strong> 
                  <span style={{ color: '#16a34a', fontWeight: '600', marginLeft: '0.5rem' }}>Verde = Correto</span>
                  <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '1rem' }}>Vermelho = Incorreto</span>
                  <span style={{ color: '#f59e0b', fontWeight: '600', marginLeft: '1rem' }}>Amarelo = Erro de leitura</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Provas">
        {user?.role === 'user' ? (
          // Visualização para usuários - suas provas realizadas
          <>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Minhas Provas</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AcademicCapIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
                  <span style={{ color: 'var(--background)', fontWeight: '600' }}>
                    {minhasProvas.length} prova{minhasProvas.length !== 1 ? 's' : ''} realizada{minhasProvas.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
              </div>
            ) : (
              renderMinhasProvas()
            )}
          </>
        ) : (
          // Visualização para admins/teachers - gerenciar provas
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Gerenciar Provas</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className={`${styles.button} ${styles.buttonOutline}`}
                    >
                      <DocumentArrowUpIcon className={styles.icon} />
                      Importar CSV
                    </button>
                    <button
                      onClick={() => {
                        setEditingProva(null);
                        setFormData({ gabarito: '', peso_questao: 0.5 });
                        setShowModal(true);
                      }}
                      className={`${styles.button} ${styles.buttonPrimary}`}
                    >
                      <PlusIcon className={styles.icon} />
                      Nova Prova
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Gabarito</th>
                    <th>Peso por Questão</th>
                    <th>Data de Criação</th>
                    {user?.role === 'admin' && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {provas.map((prova) => (
                    <tr key={prova.id}>
                      <td>{prova.id}</td>
                      <td>
                        <GabaritoDisplay 
                          gabarito={prova.gabarito}
                          size="small"
                        />
                      </td>
                      <td>{prova.peso_questao}</td>
                      <td>{new Date(prova.created_at).toLocaleDateString('pt-BR')}</td>
                      {user?.role === 'admin' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEdit(prova)}
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
                              onClick={() => handleDelete(prova.id)}
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal de Edição/Criação - Apenas para Admin */}
        {showModal && user?.role === 'admin' && (
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
                {editingProva ? 'Editar Prova' : 'Nova Prova'}
              </h3>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Gabarito (20 caracteres: a-e)
                  </label>
                  <input
                    type="text"
                    value={formData.gabarito}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      gabarito: e.target.value.toLowerCase().replace(/[^a-e]/g, '').slice(0, 20)
                    }))}
                    className={styles.formInput}
                    placeholder="eaedddccaedacbbcbacb"
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
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Peso por Questão</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10"
                    value={formData.peso_questao}
                    onChange={(e) => setFormData(prev => ({ ...prev, peso_questao: parseFloat(e.target.value) }))}
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
                    {editingProva ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Importação - Apenas para Admin */}
        {showImportModal && user?.role === 'admin' && (
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
                Importar Provas via CSV
              </h3>
              
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Peso padrão por questão</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10"
                    value={pesoQuestao}
                    onChange={(e) => setPesoQuestao(parseFloat(e.target.value))}
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Dados CSV (formato: prova,gabarito)
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    className={styles.formTextarea}
                    placeholder="prova,gabarito&#10;1,eaedddccaedacbbcbacb&#10;2,bdbbacbbaeececddbdcd"
                    rows={10}
                  />
                </div>
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