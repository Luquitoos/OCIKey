import User from '../models/User.js';
import { pool } from '../config/database-config.js';

// Função utilitária
function gerarEmail(nome) {
  return (
    nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') + '@ocikey.com'
  );
}
function gerarUsername(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Cadastro rápido: Admin cria participante+usuário automaticamente
export const cadastroRapidoParticipante = async (req, res) => {
  try {
    const { nome, escola, id_prova } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    // Email e username automáticos
    const username = gerarUsername(nome);
    const email = gerarEmail(nome);
    const password = '123456';
    // Evitar duplicatas
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe com este email ou username' });
    }
    // Gera usuário
    const user = await User.create({ username, email, password, escola, role: 'user' });

    // Cria participante vinculado ao user
    const { rows } = await pool.query(
      'INSERT INTO participantes (nome, escola, user_id) VALUES ($1, $2, $3) RETURNING *',
      [nome.trim(), escola, user.id]
    );
    const participante = rows[0];

    // Opcional: já retorna id_prova a ser vinculado/lembrado
    return res.status(201).json({
      success: true,
      participante,
      user,
      prova: id_prova
    });
  } catch (error) {
    console.error('Erro no cadastro rápido admin:', error);
    res.status(500).json({ error: 'Erro interno no cadastro rápido' });
  }
};
