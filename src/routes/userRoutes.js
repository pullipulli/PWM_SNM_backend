const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()
const hash = require('../helpers/hash');

router.delete("/:id", async (req, res) => {
    let id = req.user.username;

    if (id !== req.params.id) return res.status(403).send("You are not allowed to delete this user!");

    let dbClient = await new mongoClient(dbURI).connect()
    let filter =
        {
            $or: [
                {"username": id},
                {"email": id}
            ]
        };

    let deletedUser = await dbClient.db("SNM").collection('users').project({"password": 0}).deleteOne(filter);

    if (deletedUser == null)
        res.status(404).send("User not found");
    else return res.json(deletedUser);
})

router.get('/', async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect()
    let users = await dbClient.db("SNM").collection('users').find().project({"password": 0}).toArray();

    return res.json(users);
});

router.get('/:id', async (req, res) => {
    let id = req.params.id;

    let dbClient = await new mongoClient(dbURI).connect();

    let filter =
        {
            $or: [
                {"username": id},
                {"email": id}
            ]
        };

    let requestedUser = await dbClient.db("SNM").collection('users').find(filter).project({"password": 0}).toArray();

    if (requestedUser == null)
        return res.status(404).send("User not found");
    return res.json(requestedUser);
});

router.put("/:id", async (req, res) => {
    let id = req.params.id;
    let profile = req.body;

    let dbClient = await new mongoClient(dbURI).connect();
    let oldPassword = await dbClient.db("SNM").collection('users').find({username: id}).project({
        password: 1,
        _id: 0
    }).next();
    oldPassword = oldPassword.password;

    const actualPassword = profile.currentPassword && profile.newPassword && profile.newPassword1 &&
    profile.newPassword === profile.newPassword1 &&
    hash(profile.currentPassword) === oldPassword ?
        hash(profile.newPassword) : oldPassword;

    let updatedData = {
        $set: {
            password: actualPassword,
            favouriteGenres: profile.favouriteGenres,
            favouriteArtists: profile.favouriteArtists
        }
    };
    await dbClient.db("SNM").collection('users').updateOne({username: id}, updatedData);
    let user = await dbClient.db("SNM").collection('users').find({username: id}).project({password: 0}).toArray();
    return res.json(user[0]);
});

module.exports = router;