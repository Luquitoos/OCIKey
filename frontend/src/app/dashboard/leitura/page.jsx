"use client";

import { useState, useRef, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import GabaritoDisplay from '@/components/GabaritoDisplay';
import apiService from '@/services/api';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import styles from '@/components/styles/dashboard.module.css';

export default function LeituraPage() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickRegisterIndex, setQuickRegisterIndex] = useState(null);
  const [quickRegisterForm, setQuickRegisterForm] = useState({ nome: '', escola: '', id_prova: '' });
  const [provas, setProvas] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => 
      file.type.startsWith('image/') && 
      ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
    );
    
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && 
      ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
    );
    
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      if (files.length === 1) {
        // Processar uma única imagem
        const result = await apiService.uploadImagem(files[0]);
        setResults([{
          arquivo_original: files[0].name,
          ...result
        }]);
      } else {
        // Processar múltiplas imagens
        const result = await apiService.uploadMultiplasImagens(files);
        setResults(result.resultados || []);
      }
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      alert('Erro ao processar imagens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 0: return 'Leitura bem-sucedida';
      case 1: return 'Erro no código Aztec';
      case 2: return 'Imprecisão na leitura';
      case 3: return 'Erro fatal na leitura';
      default: return 'Erro desconhecido';
    }
  };

  const formatNota = (nota) => {
    const num = parseFloat(nota);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handleEditLeitura = (leituraId) => {
    window.location.href = `/dashboard/leituras?edit=${leituraId}`;
  };

  const handleDeleteLeitura = async (leituraId, fileName) => {
    if (!confirm(`Tem certeza que deseja excluir a leitura de "${fileName}"?`)) {
      return;
    }

    try {
      await apiService.deleteLeitura(leituraId);
      
      // Remove o resultado da lista local
      setResults(prev => prev.filter(result => result.leitura?.id !== leituraId));
      
      alert('Leitura excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir leitura:', error);
      alert('Erro ao excluir leitura: ' + error.message);
    }
  };

  // Buscar provas ao montar
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiService.getProvas();
        setProvas(resp.data?.provas || []);
      } catch {}
    })();
  }, []);

  // Checa automaticamente se existe leitura sem participante identificada e abre o modal
  useEffect(() => {
    const idx = results.findIndex(r => r.leitura && (!r.leitura.id_participante || r.leitura.id_participante <= 0));
    if (idx >= 0) setShowQuickRegister(true), setQuickRegisterIndex(idx);
  }, [results]);

  const handleQuickRegister = async (e) => {
    e.preventDefault();
    if (!quickRegisterForm.nome || !quickRegisterForm.id_prova) return alert('Preencha o nome completo e selecione uma prova');
    try {
      // Chama backend para cadastro rápido
      const resp = await apiService.cadastroRapidoParticipante({
        nome: quickRegisterForm.nome,
        escola: quickRegisterForm.escola,
        id_prova: quickRegisterForm.id_prova
      });
      const participante = resp.participante;
      // Vincula leitura ao participante criado
      const leituraId = results[quickRegisterIndex].leitura.id;
      const resp2 = await apiService.vincularLeituraParticipante(leituraId, participante.id);
      // Atualiza resultado no estado local
      setResults(prev => {
        const copia = [...prev];
        copia[quickRegisterIndex] = {
          ...prev[quickRegisterIndex],
          leitura: resp2.leitura
        };
        return copia;
      });
      setShowQuickRegister(false);
      setQuickRegisterForm({ nome: '', escola: '', id_prova: '' });
      setQuickRegisterIndex(null);
      alert('Participante cadastrado, leitura vinculada e nota recalculada!');
    } catch (err) {
      alert('Erro no cadastro rápido/vincular: ' + (err.response?.error || err.message));
    }
  };

  
  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Leitura de Gabaritos">
        <div className={styles.grid}>
          {/* Upload Area */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upload de Imagens</h2>
            </div>
            
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary)' : '#d1d5db'}`,
                borderRadius: '1rem',
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: dragActive ? '#f0f9ff' : '#f9fafb',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudArrowUpIcon 
                style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  margin: '0 auto 1rem', 
                  color: dragActive ? 'var(--primary)' : '#9ca3af' 
                }} 
              />
              <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
                {dragActive ? 'Solte as imagens aqui' : 'Clique ou arraste imagens aqui'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                PNG, JPG ou JPEG (máx. 10MB cada)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Lista de Arquivos */}
            {files.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--background)' }}>
                  Arquivos Selecionados ({files.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {files.map((file, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PhotoIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{file.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          color: '#dc2626',
                        }}
                      >
                        <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={processImages}
                    disabled={loading}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    style={{ opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? 'Processando...' : 'Processar Imagens'}
                  </button>
                  <button
                    onClick={() => setFiles([])}
                    className={`${styles.button} ${styles.buttonOutline}`}
                  >
                    Limpar Lista
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resultados */}
          {results.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Resultados da Leitura</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map((result, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1.5rem',
                      border: `2px solid ${result.leitura?.erro === 0 ? '#16a34a' : '#dc2626'}`,
                      borderRadius: '0.75rem',
                      backgroundColor: result.leitura?.erro === 0 ? '#f0fdf4' : '#fef2f2',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      {result.leitura?.erro === 0 ? (
                        <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
                      ) : (
                        <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: 'var(--background)' }}>
                          {result.arquivo_original}
                        </h3>
                        {result.participante_original && result.participante_original.user_id && (
                          <p style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280', 
                            margin: '0.25rem 0 0 0',
                            fontStyle: 'italic'
                          }}>
                            📋 Leitura cross-user: dados preservados do participante original
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {result.leitura && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                            Status:
                          </p>
                          <p style={{ margin: 0, color: result.leitura.erro === 0 ? '#16a34a' : '#dc2626' }}>
                            {getErrorMessage(result.leitura.erro)}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                            Prova:
                          </p>
                          <p style={{ margin: 0, color: 'var(--background)' }}>
                            {result.leitura.id_prova > 0 ? `Prova ${result.leitura.id_prova}` : 'Não identificada'}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                            Participante:
                          </p>
                          <p style={{ margin: 0, color: 'var(--background)' }}>
                            {result.leitura.id_participante > 0 ? `ID: ${result.leitura.id_participante}` : 'Não identificado'}
                          </p>
                          {result.participante_original && result.participante_original.user_id !== result.leitura.id_participante && (
                            <p style={{ 
                              margin: '0.25rem 0 0 0', 
                              fontSize: '0.75rem', 
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              Dados originais: {result.participante_original.nome} ({result.participante_original.escola})
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                            Acertos:
                          </p>
                          <p style={{ margin: 0, color: 'var(--background)' }}>
                            {result.leitura.acertos}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem 0' }}>
                            Nota:
                          </p>
                          <p style={{ margin: 0, color: 'var(--background)', fontSize: '1.125rem', fontWeight: '600' }}>
                            {formatNota(result.leitura.nota)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {result.leitura?.gabarito && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
                          Gabarito Lido:
                        </p>
                        <div style={{ 
                          padding: '0.75rem', 
                          backgroundColor: 'white', 
                          borderRadius: '0.5rem',
                          border: '1px solid #d1d5db',
                        }}>
                          <GabaritoDisplay 
                            gabarito={result.leitura.gabarito} 
                            size="medium"
                          />
                        </div>
                      </div>
                    )}
                    
                    {result.leitura && (
                      <div style={{ 
                        marginTop: '1.5rem', 
                        display: 'flex', 
                        gap: '1rem', 
                        paddingTop: '1rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => handleEditLeitura(result.leitura.id)}
                          className={`${styles.button} ${styles.buttonSecondary}`}
                          style={{ 
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                          Editar Leitura
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLeitura(result.leitura.id, result.arquivo_original)}
                          className={`${styles.button} ${styles.buttonOutline}`}
                          style={{ 
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#dc2626',
                            borderColor: '#dc2626'
                          }}
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          Excluir Leitura
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE CADASTRO RÁPIDO AUTOMÁTICO */}
        {showQuickRegister && (
          <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'white', padding:'2rem', borderRadius: '1rem', minWidth:'350px', maxWidth:'90vw' }}>
              <h2 style={{fontSize:'1.25rem', fontWeight:'bold', marginBottom: '1rem'}}>Cadastro rápido de participante</h2>
              <form onSubmit={handleQuickRegister}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome completo</label>
                  <input className={styles.formInput} value={quickRegisterForm.nome} onChange={e => setQuickRegisterForm(f=>({...f,nome:e.target.value}))} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Escola</label>
                  <input className={styles.formInput} value={quickRegisterForm.escola} onChange={e => setQuickRegisterForm(f=>({...f,escola:e.target.value}))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prova feita</label>
                  <select className={styles.formInput} value={quickRegisterForm.id_prova} onChange={e => setQuickRegisterForm(f=>({...f,id_prova:e.target.value}))} required>
                    <option value="">Selecione...</option>
                    {provas.map(p=>(<option key={p.id} value={p.id}>Prova {p.id} - {p.gabarito}</option>))}
                  </select>
                </div>
                <div style={{marginTop:'1.5rem',display:'flex', justifyContent:'flex-end',gap:'1rem'}}>
                  <button type="button" className={`${styles.button} ${styles.buttonOutline}`} onClick={()=>setShowQuickRegister(false)}>Cancelar</button>
                  <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>Cadastrar e Vincular</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}