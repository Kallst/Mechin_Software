require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// los middlewares 
app.use(cors());
app.use(express.json());

// Rutes
app.use('/api/auth', require('./src/modules/auth/auth.routes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
