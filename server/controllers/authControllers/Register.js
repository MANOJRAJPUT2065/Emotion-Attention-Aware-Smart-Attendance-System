const User = require("../../models/userModel");
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Register = async (req, res) => {
    console.log("Inside Register Route...")
    const { username, email, age, gender, password } = req.body;

    try {
        // Asynchronously hash the password
        const hashedPass = await bcrypt.hash(password, 10);

        const userObj = {
            username,
            email,
            age,
            gender,
            password: hashedPass
        };

        // Create user in the database
        const UserData = await User.create({ ...userObj });

        return res.status(201).json({
            message: "User registered successfully",
            userData: UserData
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = Register;
