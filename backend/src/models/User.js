/* 
 Modelo User - Camada de Acesso a Dados para Usuários
 Implementa padrão Active Record para operações de usuários
 bcrypt é uma biblioteca para hash seguro de senhas usando algoritmo bcrypt
 bcrypt adiciona salt automático e é resistente a ataques de força bruta
 Contém métodos estáticos para CRUD completo de usuários
*/

import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

/* Classe User para gerenciar operações de usuários no banco
   Implementa padrão de métodos estáticos para acesso a dados
   Encapsula toda lógica relacionada à entidade usuário */
class User {
  /* Cria um novo usuário no banco de dados
     Criptografa a senha antes de armazenar por segurança
     userData - Objeto com dados do usuário
     userData.username - Nome de usuário único
     userData.email - Email único do usuário
     userData.password - Senha em texto plano (será criptografada)
     userData.role - Role/papel do usuário (padrão: 'user')
     Retorna dados do usuário criado (sem senha) */
  static async create({ username, email, password, role = 'user' }) {
    try {
      // bcrypt.hash() criptografa a senha com salt automático
      // 10 rounds é um bom equilíbrio entre segurança e performance
      const hashedPassword = await bcrypt.hash(password, 10);

      // Query SQL para inserir novo usuário com timestamps automáticos
      // RETURNING retorna os dados inseridos (exceto senha por segurança)
      const query = `
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, username, email, role, created_at, updated_at
      `;

      // Executa a query com parâmetros seguros (previne SQL injection)
      const result = await pool.query(query, [username, email, hashedPassword, role]);
      return result.rows[0]; // Retorna o primeiro (e único) resultado
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error; // Repassa o erro para o controlador tratar
    }
  }

  /* Busca um usuário pelo ID
     Usado para autenticação e operações que precisam dos dados do usuário
     id - ID numérico do usuário
     Retorna dados do usuário (sem senha) ou null se não encontrado */
  static async findById(id) {
    try {
      // Query que exclui a senha por segurança (não é necessária para identificação)
      const query = 'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null; // Retorna o usuário ou null se não encontrado
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  /* Busca um usuário pelo email
     Usado principalmente para login e verificação de duplicatas
     email - Email do usuário
     Retorna dados completos do usuário (incluindo senha hash) ou null */
  static async findByEmail(email) {
    try {
      // Query que inclui a senha para validação de login
      // Senha é necessária para comparação durante autenticação
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  /* Busca um usuário pelo nome de usuário
     Usado para verificação de duplicatas e busca alternativa
     username - Nome de usuário
     Retorna dados completos do usuário ou null */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por nome de usuário:', error);
      throw error;
    }
  }

  /* Valida uma senha em texto plano contra a hash armazenada
     Usa bcrypt.compare() que é seguro contra timing attacks
     plainPassword - Senha em texto plano fornecida pelo usuário
     hashedPassword - Hash da senha armazenada no banco
     Retorna true se a senha é válida, false caso contrário */
  static async validatePassword(plainPassword, hashedPassword) {
    try {
      // bcrypt.compare() compara de forma segura senha com hash
      // Automaticamente extrai o salt da hash e compara
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Erro ao validar senha:', error);
      throw error;
    }
  }

  /* Atualiza um usuário pelo ID
     Constrói query dinamicamente baseada nos campos fornecidos
     id - ID do usuário a ser atualizado
     updates - Objeto com campos a serem atualizados
     Retorna dados atualizados do usuário ou null se não encontrado */
  static async updateById(id, updates) {
    try {
      const fields = []; // Array para armazenar campos SQL (campo = $n)
      const values = []; // Array para armazenar valores dos parâmetros
      let paramCount = 1; // Contador para parâmetros SQL ($1, $2, etc.)

      // Constrói dinamicamente a query baseada nos campos fornecidos
      // Ignora campos undefined e o campo 'id' por segurança
      Object.keys(updates).forEach(key => {
        if (key !== 'id' && updates[key] !== undefined) {
          fields.push(`${key} = ${paramCount}`); // Adiciona campo=valor
          values.push(updates[key]); // Adiciona valor correspondente
          paramCount++;
        }
      });

      // Verifica se há campos para atualizar
      if (fields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      // Adiciona campo de updated_at automaticamente para auditoria
      fields.push(`updated_at = NOW()`);
      values.push(id); // Adiciona ID para a cláusula WHERE

      // Constrói e executa a query de update
      const query = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE id = ${paramCount}
        RETURNING id, username, email, role, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /* Remove um usuário pelo ID
     Operação irreversível - use com cuidado
     id - ID do usuário a ser removido
     Retorna dados do usuário removido ou null se não encontrado */
  static async deleteById(id) {
    try {
      // Query que remove e retorna o ID do usuário removido para confirmação
      const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }
}

export default User;