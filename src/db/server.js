const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

// Configure CORS with specific options
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your React app URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/loginverify', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const query = 'SELECT * FROM `user` WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      console.log('Login bem-sucedido:', results[0]);
      res.json({ success: true, user: results[0] });
    } else {
      res.status(401).json({ success: false, message: 'Email ou senha incorretos!' });
    }
  });
});

app.post('/reservations', (req, res) => {
  const { userId, userName, date, startTime, endTime, allDay, items } = req.body;

  console.log('Creating reservation for user ID:', userId);
  console.log('Reservation details:', { date, startTime, endTime, allDay, items });

  try {
    const name_reservation = "Reserva de " + userName;
    const query = 'INSERT INTO reservation (name_reservation, date_reservation, inicial_hour, final_hour, all_day, usuario_id) VALUES (?, ?, ?, ?, ?, ?)';
    
    // First insert the reservation
    db.query(query, [name_reservation, date, startTime, endTime, allDay, userId], (err, results) => {
      if (err) {
        console.error('Erro ao criar reserva:', err);
        return res.status(500).json({ error: err.message });
      }
      else{
        console.log('Reserva criada com sucesso!', results);
      }

      const reservationId = results.insertId;
      console.log("Reserva criada com ID:", reservationId);

      // Then insert items using the reservation ID
      if (items && items.length > 0) {
        const itemQuery = 'INSERT INTO item (name_item, reservation_id) VALUES (?, ?)';
        let insertedItems = 0;

        items.forEach(item => {
          db.query(itemQuery, [item, reservationId], (err) => {
            if (err) {
              console.error('Erro ao inserir item:', err);
            } else {
              console.log(`Item "${item}" inserido para reserva ${reservationId}`);
              insertedItems++;
              
              // If all items are inserted, send response
              if (insertedItems === items.length) {
                res.json({ 
                  success: true, 
                  reservationId,
                  message: 'Reserva e itens criados com sucesso'
                });
              }
            }
          });
        });
      } else {
        // If no items to insert, send response immediately
        res.json({ 
          success: true, 
          reservationId,
          message: 'Reserva criada com sucesso'
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/calendar', (req, res) => {
  const query = 'SELECT * FROM reservation';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
