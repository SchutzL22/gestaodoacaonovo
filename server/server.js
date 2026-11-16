require('dotenv').config();

const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Teste de conexão com o banco de dados
pool.query('SELECT 1')
  .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  });
