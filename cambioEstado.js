const PORT5 = process.env.PORT5;
app.use(express.json());
app.use(cors());

//conexion con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// una vez validado el token se accede a este post, donde utilizando el usuario pasado se invierte su estado,
// siendo este boolean de 0 a 1 o de 1 a 0 (0 - habilitado, 1- deshabilitado)
app.post('/estadoCambiado', async (req, res) => {
    try {
      const client = await pool.connect();
      const { usuario } = req.body;
      
      const query = `
        UPDATE usuario
        SET estado = NOT estado
        WHERE "usuario" = $1;
      `;
      
      await client.query(query, [usuario]);
  
      // si el cambio fue exitoso se manda un estado true y un mensaje de actualizacion
      res.json({ success: true, message: 'Estado actualizado correctamente' });
      client.release();
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al cambiar de estado' });
    }
});

app.listen(PORT5, () => {
    console.log(`Servidor de cambio de estado corriendo en http://localhost:${PORT5}`);
});