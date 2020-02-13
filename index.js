const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const massive = require("massive");
const dotenv = require("dotenv");

dotenv.config();

const {CONNECTION_STRING} = process.env;

const app = express();

massive(CONNECTION_STRING).then(db => {
    app.set('db', db);
    console.log("DB connected!");
}).catch(err => {
    console.error(err);
})

app.use(express.json()); //body-parser

app.use(session({
    secret: "asdfzxcv", 
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}))

// async function doStuff() {

// }

// const doStuff = async () => {

// }

app.post("/auth/register", async (req, res) => {
    // const {username, password} = req.body;
    // const db = req.app.get("db");
    // bcrypt.hash(password, 12).then(hash => {
    //     db.addUser(username, hash).then(() => {
    //         req.session.username = username;
    //         res.status(200).json(req.session.username);
    //     }).catch(err => {
    //         res.status(500).json("USE A DIFFERENT USERNAME");
    //     })
    // }).catch(err => {
    //     res.status(500).json("INTERNAL SERVER ERROR");
    // })

    //ASYNC/AWAIT
    const {username, password} = req.body;
    const db = req.app.get('db');
    const hash = await bcrypt.hash(password, 12).catch(err => res.status(500).json("USE A DIFFERENT USERNAME"));
    await db.addUser(username, hash).catch(err => res.status(500).json("INTERNAL SERVER ERROR"));
    req.session.username = username;
    res.status(200).json(req.session.username);
})

app.post("/auth/login", (req, res) => {
    const {username, password} = req.body;
    const db = req.app.get("db");
    db.getUser(username).then(selectedUser => {
        if(selectedUser.length === 0) {
            res.status(404).json("USER DOES NOT EXIST");
        } else {
            bcrypt.compare(password, selectedUser[0].password).then(areEqual => {
                if(areEqual) {
                    req.session.username = selectedUser[0].username;
                    res.status(200).json(username);
                } else {
                    res.status(403).json("INCORRECT USERNAME OR PASSWORD");
                }
            })
        }
    })
})

app.listen(5050, () => console.log(`Listening on Port 5050`));