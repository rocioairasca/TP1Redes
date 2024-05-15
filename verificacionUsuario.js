// importaciones
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');


const app = express();
const PORT3 = process.env.PORT3;
app.use(express.json());
app.use(cors());

//conecxion con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// se toman los datos pasados desde el index y se verifican si existen en la base de datos usando un select
app.post('/verifyUser', async (req, res) => {
    const { usuario, contraseña } = req.body;

    try {
        const client = await pool.connect();
        const query = 'SELECT * FROM usuario WHERE "usuario" = $1 AND "contraseña" = $2';
        const result = await client.query(query, [usuario, contraseña]);

        if (result.rows.length > 0) {
            // si coinciden devuelve estado true para luego generar el token
            res.json({ success: true });
        } else {
            //si no, manda un mensaje de error
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        client.release();
        
    } catch (error) {
        console.error('Error al verificar usuario:', error);
        res.status(500).json({ error: 'Error al verificar usuario' });
    }
});


app.listen(PORT3, () => {
    console.log(`Servidor de verificacion de usuario corriendo en http://localhost:${PORT3}`);
  });
  