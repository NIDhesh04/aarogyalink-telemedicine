const mongoose = require('mongoose');

const dbconnect = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('database connected');
    }
    catch(error){
        console.log(error);
        process.exit(1);    
    }
}

module.exports = dbconnect;