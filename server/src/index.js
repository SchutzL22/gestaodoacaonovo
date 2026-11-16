require('dotenv').config();

const app  = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

// Testa conexão com o banco antes de subir o servidor
pool.query('SELECT 1')
  .then(() => {
    console.log('✅  Conexão com o banco de dados estabelecida.');
    app.listen(PORT, () => {
      console.log(`🚀  API Gestão de Doações rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌  Falha ao conectar ao banco de dados:', err.message);
    process.exit(1);
  });

