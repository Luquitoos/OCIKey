import { createPool } from './database-config.js';
import bcrypt from 'bcryptjs';

/* 
  Script para criar usuários automaticamente para participantes existentes
  Cria um usuário para cada participante que não tem user_id
  Liga automaticamente o participante ao usuário criado
*/

const pool = createPool();

// Função para gerar email baseado no nome
function gerarEmail(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '.') // Substitui espaços por pontos
    .replace(/[^a-z0-9.]/g, '') // Remove caracteres especiais
    + '@ocikey.com';
}

// Função para gerar username baseado no nome
function gerarUsername(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '') // Remove espaços
    .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
}

const criarUsuariosParaParticipantes = async () => {
  try {
    console.log('Buscando participantes sem usuário...');
    
    // Busca participantes que não têm user_id
    const { rows: participantes } = await pool.query(`
      SELECT id, nome, escola 
      FROM participantes 
      WHERE user_id IS NULL
      ORDER BY id
    `);

    if (participantes.length === 0) {
      console.log('Todos os participantes já têm usuários associados!');
      return;
    }

    console.log(`Encontrados ${participantes.length} participantes sem usuário:`);
    participantes.forEach(p => {
      console.log(`   ${p.id}. ${p.nome} (${p.escola})`);
    });

    console.log('\nCriando usuários...');

    let criados = 0;
    let erros = 0;

    for (const participante of participantes) {
      try {
        const { id, nome, escola } = participante;
        
        // Gera credenciais
        const username = gerarUsername(nome);
        const email = gerarEmail(nome);
        const password = '123456'; // Senha simples como solicitado
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verifica se já existe usuário com este email ou username
        const { rows: existingUser } = await pool.query(
          'SELECT id FROM users WHERE email = $1 OR username = $2',
          [email, username]
        );

        if (existingUser.length > 0) {
          console.log(`${nome}: Usuário já existe (${email})`);
          continue;
        }

        // Cria o usuário
        const { rows: newUser } = await pool.query(`
          INSERT INTO users (username, email, password, escola, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'user', NOW(), NOW())
          RETURNING id, username, email, escola
        `, [username, email, hashedPassword, escola]);

        const userId = newUser[0].id;

        // Liga o participante ao usuário
        await pool.query(
          'UPDATE participantes SET user_id = $1 WHERE id = $2',
          [userId, id]
        );

        console.log(`${nome}:`);
        console.log(`Usuário: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Senha: ${password}`);
        console.log(`Escola: ${escola}`);
        console.log(`Ligado ao participante ID ${id}`);
        console.log('');

        criados++;

      } catch (participanteError) {
        console.error(`Erro ao processar ${participante.nome}:`, participanteError.message);
        erros++;
      }
    }

    console.log('Resumo da operação:');
    console.log(`Usuários criados: ${criados}`);
    console.log(`Erros: ${erros}`);
    console.log(`Total processado: ${participantes.length}`);

    if (criados > 0) {
      console.log('\nUsuários criados com sucesso!');
      console.log('Credenciais de acesso:');
      console.log('Email: [nome.completo]@ocikey.com');
      console.log('Senha: 123456 (para todos)');
      console.log('Username: [nomecompleto] (sem espaços)');
      console.log('\nRecomendação: Peça aos usuários para alterarem suas senhas após o primeiro login.');
    }

  } catch (error) {
    console.error('Erro na criação de usuários:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

// Executa o script
criarUsuariosParaParticipantes()
  .then(() => {
    console.log('\nScript finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na criação de usuários:', error);
    process.exit(1);
  });