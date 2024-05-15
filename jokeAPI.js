// importaciones
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');


const app = express();
const PORT6 = process.env.PORT6;
app.use(express.json());
app.use(cors());

// cuando llaman a este endpoint hace uso de la API y devuelve en formato json chiste de programacion
app.get('/jokeAPI',async (req, res) => {
    try {
        const response = await axios.get('https://v2.jokeapi.dev/joke/Programming?lang=es');
        res.json(response.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener broma' });
    }
});

app.listen(PORT6, () => {
    console.log(`Servidor de bromas corriendo en http://localhost:${PORT6}`);
});