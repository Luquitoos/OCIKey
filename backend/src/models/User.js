import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

/*
 Modelo User para operações relacionadas a usuários
 Contém métodos estáticos para CRUD de usuários
*/
class User {
  /*
   Cria um novo usuário no banco de dados
   userData - Dados do usuário
   userData.username - Nome de usuário
   userData.email - Email do usuário
   userData.password - Senha em texto
   userData.role - Role do usuário (padrão: 'user')
   Dados do usuário criado
   */
  static async create({ username, email, password, role = 'user' }) {
    try {
      // Define número de rounds para hash da senha (mais rounds = mais seguro, mas mais lento)
      // Criptografa a senha usando bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Query SQL para inserir novo usuário
      const query = `
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, username, email, role, created_at, updated_at
      `;

      // Executa a query com os parâmetros
      const result = await pool.query(query, [username, email, hashedPassword, role]);
      return result.rows[0]; // Retorna o primeiro (e único) resultado
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error; // Repassa o erro para o controlador
    }
  }

  /*
    Busca um usuário pelo ID retorna com Dados do usuário ou null se não encontrado
  */
  static async findById(id) {
    try {
      // Query que exclui a senha por segurança
      const query = 'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null; // Retorna o usuário ou null
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  /*
   Busca um usuário pelo email
   email - Email do usuário
   Dados completos do usuário (incluindo senha) ou null
  */
  static async findByEmail(email) {
    try {
      // Query que inclui a senha para validação de login
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  /*
   Busca um usuário pelo nome de usuário
   username - Nome de usuário
   Dados completos do usuário ou null
  */
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

  /*
   Valida uma senha em texto plano contra a hash armazenada
   plainPassword - Senha em texto plano
   hashedPassword - Hash da senha armazenada
   True se a senha é válida, false caso contrário
  */
  static async validatePassword(plainPassword, hashedPassword) {
    try {
      // Usa bcrypt para comparar a senha com a hash
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Erro ao validar senha:', error);
      throw error;
    }
  }

  /*
   Atualiza um usuário pelo ID
   id - ID do usuário
   updates - Campos a serem atualizados
   Dados atualizados do usuário ou null
  */
  static async updateById(id, updates) {
    try {
      const fields = []; // Array para armazenar campos SQL
      const values = []; // Array para armazenar valores dos parâmetros
      let paramCount = 1; // Contador para parâmetros SQL ($1, $2, etc.)

      // Constrói dinamicamente a query baseada nos campos fornecidos
      Object.keys(updates).forEach(key => {
        if (key !== 'id' && updates[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`); // Adiciona campo=valor
          values.push(updates[key]); // Adiciona valor correspondente
          paramCount++;
        }
      });

      // Verifica se há campos para atualizar
      if (fields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      // Adiciona campo de updated_at automaticamente
      fields.push(`updated_at = NOW()`);
      values.push(id); // Adiciona ID para a cláusula WHERE

      // Constrói e executa a query de update
      const query = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING id, username, email, role, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /*
    Remove um usuário pelo ID
    id - ID do usuário
    Dados do usuário removido ou null
  */
  static async deleteById(id) {
    try {
      // Query que remove e retorna o ID do usuário removido
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