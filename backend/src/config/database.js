import { createPool } from './database-config.js';

/* Pool principal de conexões com o banco de dados sendo Usado por toda a 
aplicação para operações de banco e Utiliza a configuração centralizada do 
database-config.js */
const pool = createPool();

export default pool;