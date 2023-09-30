const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()

router.get("/", async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect();
    let songs = await dbClient.db("SNM").collection("songs").find().toArray();

    if (songs != null)
        return res.json(songs);
    res.status(404).send("Songs not found");
});

router.get("/:id", async (req, res) => {
    let id = req.params.id;
    let dbClient = await new mongoClient(dbURI).connect();
    let song = await dbClient.db("SNM").collection("songs").find({"_id":id}).toArray();

    if (song != null)
        return res.json(song);
    res.status(404).send("Song not found");
});


module.exports = router