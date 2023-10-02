const express = require('express');
const {MongoClient: mongoClient} = require("mongodb");
const router = express.Router();
const hash = require('../helpers/hash');
const dbURI = process.env.DB_URI;

router.post('/register', async (req, res) => {
    let login = req.body;

    if (login.username === undefined) {
        res.status(400).send("Missing UserName");
        return;
    }

    if (login.name === undefined) {
        res.status(400).send("Missing Name");
        return;
    }

    if (login.surname === undefined) {
        res.status(400).send("Missing Surname");
        return;
    }

    if (login.email === undefined) {
        res.status(400).send("Missing E-mail");
        return;
    }

    if (login.password === undefined) {
        res.status(400).send("Missing Password");
        return;
    }

    if (login.password1 === undefined) {
        res.status(400).send("Missing Confirm Password");
        return;
    }

    if (login.favouriteArtists === undefined) {
        res.status(400).send("Missing Artist Preferences");
        return;
    }

    if (login.favouriteGenres === undefined) {
        res.status(400).send("Missing Genre Preferences");
        return;
    }

    login.password = hash(login.password);
    login.password1 = hash(login.password1);

    if (login.password !== login.password1) return res.status(400).send("Password and confirm password must be equal!");

    let dbClient = await new mongoClient(dbURI).connect();

    let user = await dbClient.db("SNM").collection("users").findOne({"username": login.username, "email":login.email});
    let items;
    if (user == null){
        items = await dbClient.db("SNM").collection('users').insertOne(login);

        return res.json(items);
    }

    res.status(400).send("Utente già presente");
});

router.post("/login", async (req, res) => {
    let login = req.body;

    if (login.username === undefined) {
        res.status(400).send("Missing UserName");
        return;
    }

    if (login.password === undefined) {
        res.status(400).send("Missing Password");
        return;
    }

    login.password = hash(login.password);

    let dbClient = await new mongoClient(dbURI).connect()
    let filter = {
        $and: [{
            $or: [
                { "username": login.username },
                { "email":login.username }
            ]},
            { "password": login.password }
        ],
    }
    let loggedUser = await dbClient.db("SNM")
        .collection('users')
        .findOne(filter, {projection: {"password": 0}})

    if (loggedUser == null)
        return res.status(400).send("Username or password incorrect.");

    return res.json(loggedUser);
});

module.exports = router