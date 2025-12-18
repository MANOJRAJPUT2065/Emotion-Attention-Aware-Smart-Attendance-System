const express = require('express');
const router = express.Router();

// Import controllers
const registerController = require("../controllers/authControllers/register");
const loginController = require("../controllers/authControllers/Login");
const testController = require("../controllers/testController");
const { getMessagesByChannel } = require('../controllers/chatControllers/messageController');
const { getDirectMessages, sendDirectMessage } = require('../controllers/chatControllers/directMessageController');
const { getAllUsers } = require('../controllers/chatControllers/getAllUsers'); 

// Routes
router.post('/register', registerController); 
router.post('/login', loginController); 
router.post('/direct-message/:user1/:user2', sendDirectMessage);

router.get('/direct-message/:user1/:user2', getDirectMessages); 
router.get('/', testController.sayHello); 
router.get('/messages/:channel', getMessagesByChannel);
router.get('/users', getAllUsers); 

module.exports = router;
