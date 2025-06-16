const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Método para obter o token do localStorage
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Método para definir o token no localStorage
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // Método para remover o token
  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token se disponível
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Retornar o objeto de erro completo para melhor tratamento
        const error = new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
        error.response = data;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }
    
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.removeToken();
    }
  }

  // Métodos para participantes
  async getParticipantes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/participantes${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async createParticipante(participante) {
    return this.request('/participantes', {
      method: 'POST',
      body: JSON.stringify(participante),
    });
  }

  async updateParticipante(id, participante) {
    return this.request(`/participantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(participante),
    });
  }

  async deleteParticipante(id) {
    return this.request(`/participantes/${id}`, {
      method: 'DELETE',
    });
  }

  async importParticipantes(csvData) {
    return this.request('/participantes/import', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  async getMeuPerfil() {
    return this.request('/participantes/meu-perfil');
  }

  async getMinhasEstatisticas(idProva = null) {
    const params = idProva ? `?id_prova=${idProva}` : '';
    return this.request(`/participantes/minhas-estatisticas${params}`);
  }

  async getEscolas() {
    return this.request('/participantes/escolas');
  }

  // Métodos para provas
  async getProvas() {
    return this.request('/provas');
  }

  async createProva(prova) {
    return this.request('/provas', {
      method: 'POST',
      body: JSON.stringify(prova),
    });
  }

  async updateProva(id, prova) {
    return this.request(`/provas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prova),
    });
  }

  async deleteProva(id) {
    return this.request(`/provas/${id}`, {
      method: 'DELETE',
    });
  }

  async importProvas(csvData, pesoQuestao = 0.5) {
    return this.request('/provas/import', {
      method: 'POST',
      body: JSON.stringify({ csvData, pesoQuestao }),
    });
  }

  // Métodos para leituras
  async getLeituras(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/leituras${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    
    // Garantir que as notas sejam números
    if (response.data && response.data.leituras) {
      response.data.leituras = response.data.leituras.map(leitura => ({
        ...leitura,
        nota: parseFloat(leitura.nota) || 0,
        acertos: parseInt(leitura.acertos) || 0,
      }));
    }
    
    return response;
  }

  // Estatísticas de leituras
  async getEstatisticasLeituras() {
    return this.request('/leituras/estatisticas');
  }

  async updateLeitura(id, leitura) {
    return this.request(`/leituras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leitura),
    });
  }

  async deleteLeitura(id) {
    return this.request(`/leituras/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para leitura de gabaritos
  async uploadImagem(file) {
    const formData = new FormData();
    formData.append('imagem', file);

    const response = await this.request('/leitura/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type para FormData
      body: formData,
    });

    // Garantir que a nota seja número
    if (response.leitura) {
      response.leitura.nota = parseFloat(response.leitura.nota) || 0;
      response.leitura.acertos = parseInt(response.leitura.acertos) || 0;
    }

    return response;
  }

  async uploadMultiplasImagens(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('imagens', file);
    });

    const response = await this.request('/leitura/upload-multiplas', {
      method: 'POST',
      headers: {}, // Remove Content-Type para FormData
      body: formData,
    });

    // Garantir que as notas sejam números
    if (response.resultados) {
      response.resultados = response.resultados.map(resultado => ({
        ...resultado,
        leitura: resultado.leitura ? {
          ...resultado.leitura,
          nota: parseFloat(resultado.leitura.nota) || 0,
          acertos: parseInt(resultado.leitura.acertos) || 0,
        } : resultado.leitura
      }));
    }

    return response;
  }

  async processarImagem(caminhoImagem) {
    return this.request('/leitura/processar', {
      method: 'POST',
      body: JSON.stringify({ caminhoImagem }),
    });
  }

  async processarMultiplasImagens(caminhosImagens) {
    return this.request('/leitura/multiplas', {
      method: 'POST',
      body: JSON.stringify({ caminhosImagens }),
    });
  }

  // Método para verificar saúde da API
  async checkHealth() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;