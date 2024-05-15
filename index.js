const express = require('express');
const axios = require('axios');
require('dotenv').config();
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT;
const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

//conexion con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar el token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
};

// generamos el token utilizando una firma (JWT_SECRET)
const generateToken = (user) => {
  try {
    //convierto el nombre de usuario a objeto
    const userObject = typeof user === 'string' ? { user } : user;
    return jwt.sign(userObject, JWT_SECRET, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error al generar el token:', error);
    return null;
  }
};

// middleware para verificar el rol del usuario
const checkUserRole = async (req, res, next) => {
  try {
    //Obtenemos el nombre de usuario del token 
    const username = req.user.user; 

    //Consultamos el rol del usuario en la base de datos
    const query = 'SELECT rol FROM usuario WHERE "usuario" = $1';
    const result = await pool.query(query, [username]);

    //Verificamos si el usuario tiene el rol correcto (rol = true -> es el administrador)
    const { rol } = result.rows[0];
    
    if (rol !== true) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    //Si el usuario tiene el rol correcto, permitimos el acceso al endpoint
    next();
  } catch (error) {
    console.error('Error al verificar el rol del usuario:', error);
    res.status(500).json({ error: 'Error al verificar el rol del usuario' });
  }
};

//middleware para verificar el estado del usuario
const checkUserStatus = async (req, res, next) => {
  try {
    //obtenemos el nombre del usuario a traves del token 
    const username = req.user.user; 

    //consultamos el estado del usuario en la base de datos
    const query = 'SELECT estado FROM usuario WHERE "usuario" = $1';
    const result = await pool.query(query, [username]);

    //vemos si el usuario tiene el estado correcto (estado = false -> usuario habilitado)
    const { estado } = result.rows[0];
    if (estado !== false) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // si es asi permitimos el acceso al endpoint
    next();
  } catch (error) {
    console.error('Error al verificar el estado del usuario:', error);
    res.status(500).json({ error: 'Error al verificar el estado del usuario' });
  }
};


//Logeo de usuario con contraseña
app.post('/login', async (req, res) => {
  const { usuario, contraseña } = req.body;
  
  try {
    //se hace una solicitud al microservicio para que verifique con la base de datos si el usuario y contraseña son correctos
    const response = await axios.post('http://localhost:6002/verifyUser', { usuario, contraseña });

    //si los datos son validos devuelve estado true y se genera el token
    if (response) {
      const token = generateToken(usuario);
      res.json( {token} ); 
    }

  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

// registro del usuario
app.post('/registro',  async (req, res) => {
  try {
    const { usuario, contraseña, nombre, apellido } = req.body;
  
    //se hace un post al microservicio pasandole los datos adecuados para que se almacenen en la base de datos
    const response = await axios.post('http://localhost:6001/registroUsuario', {
      usuario,
      contraseña,
      nombre,
      apellido
    });
  
    //Si se guardan correctamente devuelve respuesta acertiva
    const registro = response.data;
    res.json({ registro });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al realizar el registro' });
  }
});

// cambio de rol de los usuario registrados con verificacion del token
app.post('/cambioRol', verifyToken, checkUserRole, checkUserStatus, async (req, res) => {
  try{
    const { usuario } = req.body;
    // una vez validado el token se hace un post al microservicio para revertir el rol del usuario mandado
    const response = await axios.post('http://localhost:6003/rolCambiado', {
      usuario
    });
    
    // manejo de respuesta acertiva
    const rol = response.data
    res.json({ rol });
  } catch (error) {
     console.error(error);
    res.status(500).json({ error: 'Error al asignar rol' });
  }
});

// cambio de estado de los usuario registrados con verificacion del token
app.post('/cambioEstado', verifyToken, checkUserRole, checkUserStatus, async (req, res) => {
  try{
    const { usuario } = req.body;
    // una vez validado el token se hace un post al microservicio para revertir el estado del usuario mandado
    const response = await axios.post('http://localhost:6004/estadoCambiado', {
      usuario
    });
    
    // manejo de respuesta acertiva
    const estado = response.data
    res.json({ estado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado' });
  }
});

// endpoint que hace un pedido al microservicio de una API de chistes
app.get('/broma', verifyToken, checkUserStatus, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:6005/jokeAPI');
    res.json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al pedir a API broma' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

// mensaje para ver si el servidor se levanto
app.listen(PORT, () => {
  console.log(`Servidor index corriendo en http://localhost:${PORT}`);
});