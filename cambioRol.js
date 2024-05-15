const PORT4 = process.env.PORT4;
app.use(express.json());
app.use(cors());

//conexion con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// una vez validado el token se accede a este post, donde utilizando el usuario pasado se invierte su rol,
// siendo este boolean de 0 a 1 o de 1 a 0 (0 - usuario comun, 1- administrador)
app.post('/rolCambiado', async (req, res) => {
  try {
    const client = await pool.connect();
    const { usuario } = req.body;
    
    const query = `
      UPDATE usuario
      SET rol = NOT rol
      WHERE "usuario" = $1;
    `;
    
    await client.query(query, [usuario]);

    // si el cambio fue exitoso se manda un estado true y un mensaje de actualizacion
    res.json({ success: true, message: 'Rol actualizado correctamente' });
    client.release();
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar de rol' });
  }
});

app.listen(PORT4, () => {
    console.log(`Servidor de cambio de roles corriendo en http://localhost:${PORT4}`);
});