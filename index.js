const express = require("express"); //imports
const session = require("express-session"); 
const bcrypt = require("bcryptjs");
const massive = require("massive");
const dotenv = require("dotenv");

dotenv.config(); //Enables us to access .env via `process.env`

const {CONNECTION_STRING} = process.env; //We destructure the CONNECTION_STRING

const app = express(); //Returns to us a server object

massive(CONNECTION_STRING).then(db => { //Connects to the DB and gives us access to it
    app.set('db', db); //Saves the db as a server variable 
    console.log("DB connected!"); //Tells us that we successfully connected to the database
}).catch(err => { //If there is an error
    console.error(err); //We will reflect it in the console
})

app.use(express.json()); //body-parser - gives us access to req.body

app.use(session({ //Sets up sessions
    secret: "asdfzxcv",  //The salt used for creating the unique id in the front-end cookie
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 //maxAge of the cookie
    }
}))
//Example async functions
// async function doStuff() {

// }

// const doStuff = async () => {

// }

app.post("/auth/register", async (req, res) => { //Note that `async` is only necessary if we use the `await` approach at the bottom
    // const {username, password} = req.body; //Destructure username and password off req.body
    // const db = req.app.get("db"); //grab the db variable we saved earlier 
    // bcrypt
    // .hash(password, 12) //Hashes `password` and uses a salt with a length of 12
    // .then(hash => { // Gives us the newly hashed password
    //     db.
    //     addUser(username, hash) //Runs the addUser SQL file and passes in `username` and `hash`
    //     .then(() => {
    //         req.session.username = username; //Save the username on session. We can really save anything on it, whatever we will need in the future. But putting something on session shows that a given user is logged in.
    //         res.status(200).json(req.session.username); //Send back the info we saved on session
    //     }).catch(err => { //If the SQL file throws an error...
    //         res.status(500).json("USE A DIFFERENT USERNAME"); //Apply a status of 500 and send back an error message
    //     })
    // }).catch(err => { //If bcrypt.hash throws an error...
    //     res.status(500).json("INTERNAL SERVER ERROR"); //Apply a status of 500 and send back an error message
    // })

    /********** NOTE - THIS IS AN ALTERNATIVE TO THE METHOD ABOVE *********/
    //ASYNC/AWAIT
    const {username, password} = req.body; //Destructure username and password off of `req.body`
    const db = req.app.get('db'); //Get the db server variable
    const hash = await bcrypt //We resolve the promise and save the result in a variable of hash
    .hash(password, 12) //We run the has method on `password` with a length of 12
    .catch(err => {
        res.status(500).json("USE A DIFFERENT USERNAME") //If an error is thrown we respond back with an error message
        return; //Ends the function. We don't continue any further
    }); 
    await db //We resolve the promise. We don't need the result, so we don't save it in a variable
    .addUser(username, hash) //Runs the addUser SQL file and passes in `username` and `hash`
    .catch(err => {
        res.status(500).json("INTERNAL SERVER ERROR") //If there is an error than we send back 500 plus an error message
        return; //Ends the function. We don't continue any further
    }); 
    req.session.username = username; //Puts the username on session
    res.status(200).json(req.session.username); //Sends back 200 + user info.
})

app.post("/auth/login", (req, res) => {
    const {username, password} = req.body; //Take username and password off of req.body
    const db = req.app.get("db"); //Gets the db server variable
    db
    .getUser(username) //Runs the getUser SQL file and passes in `username` as the parameter
    .then(selectedUser => { //assigns the selected rows to the selectedUser param
        if(selectedUser.length === 0) { //If didnt select anyone 
            res.status(404).json("USER DOES NOT EXIST"); //Send back the appropriate error
        } else {
            bcrypt
            .compare(password, selectedUser[0].password) //compares the unhashed password with the hashed password that was stored in the database...
            .then(areEqual => { //...and gives us a boolean stating whether the passwords were equal or not
                if(areEqual) { //If the passwords were equal
                    req.session.username = selectedUser[0].username; //Put the user on the session essentially loggin them in
                    res.status(200).json(username); //Send back 200 plus the username
                } else {
                    res.status(403).json("INCORRECT USERNAME OR PASSWORD"); //Otherwise send back the 403 status and an error message
                }
            })
        }
    })
})

app.listen(5050, () => console.log(`Listening on Port 5050`));