// importaciones
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');


const app = express();
const PORT2 = process.env.PORT2;
app.use(express.json());
app.use(cors());

//conexion con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// le pasamos el query a la base de datos para que cree la tabla usuario en caso de que esta no exista, si existe se pasa por alto
(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(255) NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        nombre VARCHAR(255),
        apellido VARCHAR(255),
        estado BOOLEAN DEFAULT false,
        rol BOOLEAN DEFAULT false
      );  
    `);
  } catch (err) {
    console.error('Error creando la tabla', err);
  } finally {
    client.release();
  }
})();

// en este post se utilizan los datos pasados del index y se insertan en la tabla respectivamente
app.post('/registroUsuario', async (req, res) => {
  try {
      const { usuario, contraseña, nombre, apellido } = req.body;
      const client = await pool.connect();
      const query = 'INSERT INTO usuario (usuario, contraseña, nombre, apellido) VALUES ($1, $2, $3, $4)';
      await client.query(query, [usuario, contraseña, nombre, apellido]);
      
      client.release();
      res.json({ message: 'Usuario registrado correctamente' });

    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

app.listen(PORT2, () => {
    console.log(`Servidor de registro de usuario en el puerto ${PORT2}`);
});