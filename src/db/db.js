require('dotenv').config({ path: __dirname + '/../../.env' });
const{ DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const mysql = require('mysql2');

const connection = mysql.createPool({
  host: DB_HOST,     // seu host
  user: DB_USER,          // seu usuário
  password: DB_PASSWORD,  // sua senha
  database: DB_NAME, // seu banco
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

connection.getConnection((err, conn) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão ao banco de dados bem-sucedida!');
  conn.release();
});

module.exports = connection;
