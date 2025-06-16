"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import styles from '@/components/styles/dashboard.module.css';
import api from '@/services/api';
import { Bar, Pie, Doughnut, Line, PolarArea, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
// import 'chartjs-chart-box-and-violin-plot';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

const statLabels = {
  total_leituras: "Leituras Realizadas",
  leituras_sucesso: "Leituras com Sucesso",
  leituras_erro: "Leituras com Erro",
  taxa_sucesso: "Taxa de Sucesso",
  nota_media: "Média das Notas",
  nota_maxima: "Nota Máxima",
  nota_minima: "Nota Mínima",
  participantes_unicos: "Participantes Únicos",
  provas_distintas: "Provas Distintas",
  melhor_prova: "Prova com Melhor Média",
  melhor_prova_media: "Média da Melhor Prova",
  moda_nota: "Moda das Notas",
  moda_nota_freq: "Frequência da Moda"
};

function safeValue(val) {
  return val !== null && val !== undefined && val !== '' ? val : '-';
}

const chartColors = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
  indigo: '#6366f1',
  gray: '#6b7280'
};

export default function RelatoriosPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getEstatisticasLeituras();
        setStats(res.data.estatisticas);
      } catch (err) {
        setError("Erro ao carregar estatísticas.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Gráfico de pizza: leituras sucesso vs erro
  const pieData = stats ? {
    labels: ["Leituras Processadas com Sucesso", "Leituras com Erro de Processamento"],
    datasets: [
      {
        data: [stats.leituras_sucesso || 0, stats.leituras_erro || 0],
        backgroundColor: [chartColors.success, chartColors.danger],
        borderColor: ['#ffffff'],
        borderWidth: 2,
        hoverOffset: 4
      },
    ],
  } : null;

  // Gráfico de barras para média, moda e máximo das notas
  const notasBarData = stats ? {
    labels: ["Mínimo", "Média", "Moda", "Máximo"],
    datasets: [
      {
        label: "Notas",
        data: [
          stats.nota_minima || 0,
          stats.nota_media || 0,
          stats.moda_nota || 0,
          stats.nota_maxima || 0
        ],
        backgroundColor: [chartColors.danger, chartColors.primary, chartColors.info, chartColors.success],
        borderColor: [chartColors.danger, chartColors.primary, chartColors.info, chartColors.success],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  } : null;

  // Gráfico de linha: evolução das métricas
  const lineData = stats ? {
    labels: ["Participantes", "Provas", "Leituras Totais", "Leituras Processadas"],
    datasets: [
      {
        label: "Quantidade",
        data: [
          stats.participantes_unicos || 0,
          stats.provas_distintas || 0,
          stats.total_leituras || 0,
          stats.leituras_sucesso || 0
        ],
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primary + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  } : null;

  // Gráfico doughnut: taxa de sucesso
  const doughnutData = stats ? {
    labels: ["Taxa de Sucesso no Processamento", "Taxa de Erro no Processamento"],
    datasets: [
      {
        data: [
          parseFloat(stats.taxa_sucesso) || 0,
          100 - (parseFloat(stats.taxa_sucesso) || 0)
        ],
        backgroundColor: [chartColors.success, chartColors.gray + '40'],
        borderColor: ['#ffffff'],
        borderWidth: 3,
        cutout: '70%',
      },
    ],
  } : null;

  // Gráfico polar: distribuição geral
  const polarData = stats ? {
    labels: ["Participantes", "Provas", "Processamento Sucesso", "Processamento Erro"],
    datasets: [
      {
        data: [
          stats.participantes_unicos || 0,
          stats.provas_distintas || 0,
          stats.leituras_sucesso || 0,
          stats.leituras_erro || 0
        ],
        backgroundColor: [
          chartColors.primary + '80',
          chartColors.warning + '80',
          chartColors.success + '80',
          chartColors.danger + '80'
        ],
        borderColor: [
          chartColors.primary,
          chartColors.warning,
          chartColors.success,
          chartColors.danger
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };

  const boxplotOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const data = context.parsed;
            return [
              `Mínimo: ${data.min}`,
              `Q1: ${data.q1}`,
              `Mediana: ${data.median}`,
              `Média: ${data.mean}`,
              `Q3: ${data.q3}`,
              `Máximo: ${data.max}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="Relatórios">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>📊 Relatórios e Estatísticas</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              Análise completa dos dados da olimpíada
            </p>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} /> Carregando estatísticas...
            </div>
          )}
          
          {error && (
            <div className={styles.error}>{error}</div>
          )}
          
          {stats && (
            <>
              {/* Seção: Métricas Principais */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  📈 Métricas Principais
                </h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard} style={{ background: '#70B489', color: 'white' }}>
                    <div className={styles.statContent}>
                      <h3 style={{ color: 'white' }}>{safeValue(stats.total_leituras)}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.9)' }}>{statLabels.total_leituras}</p>
                    </div>
                  </div>
                  <div className={styles.statCard} style={{ background: '#DD6C49', color: 'white' }}>
                    <div className={styles.statContent}>
                      <h3 style={{ color: 'white' }}>{safeValue(stats.participantes_unicos)}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.9)' }}>{statLabels.participantes_unicos}</p>
                    </div>
                  </div>
                  <div className={styles.statCard} style={{ background: '#F3BF49', color: '#2d3748' }}>
                    <div className={styles.statContent}>
                      <h3 style={{ color: 'white' }}>{safeValue(stats.provas_distintas)}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.9)' }}>{statLabels.provas_distintas}</p>
                    </div>
                  </div>
                  <div className={styles.statCard} style={{ background: 'white', color: '#2d3748', border: '2px solid #e2e8f0' }}>
                    <div className={styles.statContent}>
                      <h3 style={{ color: '#2d3748' }}>{safeValue(stats.taxa_sucesso)}%</h3>
                      <p style={{ color: 'rgba(45,55,72,0.8)' }}>Taxa de Sucesso no Processamento</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Informações Detalhadas */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  📋 Informações Detalhadas
                </h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.leituras_sucesso)}</h3><p>{statLabels.leituras_sucesso}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.leituras_erro)}</h3><p>{statLabels.leituras_erro}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.nota_media)}</h3><p>{statLabels.nota_media}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.nota_maxima)}</h3><p>{statLabels.nota_maxima}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.nota_minima)}</h3><p>{statLabels.nota_minima}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.moda_nota)}</h3><p>{statLabels.moda_nota}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.moda_nota_freq)}</h3><p>{statLabels.moda_nota_freq}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.melhor_prova)}</h3><p>{statLabels.melhor_prova}</p></div></div>
                  <div className={styles.statCard}><div className={styles.statContent}><h3>{safeValue(stats.melhor_prova_media)}</h3><p>{statLabels.melhor_prova_media}</p></div></div>
                </div>
              </div>

              {/* Seção: Análise de Performance */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  🎯 Análise de Performance no Processamento
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: '16px', 
                    padding: '1.5rem', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ 
                      textAlign: 'center', 
                      marginBottom: '1rem',
                      color: '#374151',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      📊 Distribuição do Processamento de Leituras
                    </h4>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pie data={pieData} options={chartOptions} />
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: '16px', 
                    padding: '1.5rem', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ 
                      textAlign: 'center', 
                      marginBottom: '1rem',
                      color: '#374151',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      🎯 Taxa de Sucesso no Processamento
                    </h4>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Doughnut data={doughnutData} options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            display: false
                          }
                        }
                      }} />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 'bold', color: chartColors.success }}>
                        {safeValue(stats.taxa_sucesso)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Análise de Notas */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  📝 Análise de Notas
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: '16px', 
                    padding: '1.5rem', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ 
                      textAlign: 'center', 
                      marginBottom: '1rem',
                      color: '#374151',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      📊 Notas: Média, Moda e Máximo
                    </h4>
                    <Bar data={notasBarData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }} />
                  </div>
                  
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: '16px', 
                    padding: '1.5rem', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ 
                      textAlign: 'center', 
                      marginBottom: '1rem',
                      color: '#374151',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      🌟 Visão Polar dos Dados
                    </h4>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PolarArea data={polarData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Tendências */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  📈 Tendências e Métricas Gerais
                </h3>
                <div style={{ 
                  background: '#fff', 
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ 
                    textAlign: 'center', 
                    marginBottom: '1rem',
                    color: '#374151',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    📊 Evolução das Métricas
                  </h4>
                  <Line data={lineData} options={lineOptions} />
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
