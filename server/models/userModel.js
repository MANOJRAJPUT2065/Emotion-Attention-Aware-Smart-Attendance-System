const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    age:{
        type:Number,
        required:true,
    },
    gender:{
        type:String,
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
},{timestamps:true});


module.exports = new mongoose.model('User',UserSchema);