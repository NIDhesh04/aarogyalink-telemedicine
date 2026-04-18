const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const dbconnect = require('./config/db');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dbconnect();    

app.use(cors());
app.use(express.json());
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/',(req,res)=>{
    res.send('aarogyalink backend is running')
})

app.listen(3000,()=>{
    console.log('server is running')
});
