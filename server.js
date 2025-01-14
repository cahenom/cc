const express = require('express');
const cors = require('cors');
const wbKurirRoute = require('./pages/api/wb&kurir');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Route API
app.use('/api/wb&kurir', wbKurirRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
