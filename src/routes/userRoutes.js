const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()
const hash = require('../helpers/hash');

router.delete("/:id", async (req, res) => {
    let id = req.user.username;

    if(id !== req.params.id) return res.status(403).send("You are not allowed to delete this user!");

    let dbClient = await new mongoClient(dbURI).connect()
    let filter =
        {
            $or: [
                { "username": id },
                { "email": id }
            ]
        };

    let deletedUser = await dbClient.db("SNM").collection('users').project({"password":0}).deleteOne(filter);

    if(deletedUser == null)
        res.status(404).send("User not found");
    else return res.json(deletedUser);
})

router.get('/', async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect()
    let users = await dbClient.db("SNM").collection('users').find().project({ "password": 0 }).toArray();

    return res.json(users);
});

router.get('/:id', async(req, res) => {
    let id = req.params.id;

    let dbClient = await new mongoClient(dbURI).connect();

    let filter =
        {
            $or: [
                { "username": id },
                { "email": id }
            ]
        };

    let requestedUser = await dbClient.db("SNM").collection('users').find(filter).project({"password":0}).toArray();

    if (requestedUser == null)
        return res.status(404).send("User not found");
    return res.json(requestedUser);
});

router.put("/:id", async (req, res) => {
    let id = req.params.id;
    let profile = req.body;

    let dbClient = await new mongoClient(dbURI).connect();
    let oldPassword = await dbClient.db("SNM").collection('users').find({username:id}).project({password:1,_id:0}).next();
    oldPassword = oldPassword.password;
    if (hash(profile.currentPassword) === oldPassword) {
        let updatedData = {
            $set : {
                password: hash(profile.newPassword),
                favouriteGenres: profile.selectedGenres,
                favouriteArtists: profile.selectedArtists
            }
        } ;
        let updatedUser = await dbClient.db("SNM").collection('users').updateOne({username:id}, updatedData);
        return res.json(updatedUser);
    }

    res.status(403).send("Forbidden. Current password is wrong.")
});

module.exports = router;