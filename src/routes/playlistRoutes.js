const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()

router.post("/", async (req, res) => {
    let playlist = req.body;

    if (playlist.owner === undefined) {
        res.status(400).send("Missing UserName of the playlist owner");
        return;
    }

    if (playlist.name === undefined) {
        res.status(400).send("Missing Playlist Name");
        return;
    }

    if (playlist.songs === undefined) {
        res.status(400).send("Missing Playlist tracks");
        return;
    }

    if (playlist.description === undefined) {
        res.status(400).send("Missing Playlist Description");
        return;
    }

    if (playlist.privacy === undefined) {
        res.status(400).send("Missing Playlist privacy (private or public)");
        return;
    }

    if (playlist.tags === undefined) {
        res.status(400).send("Missing PLaylist tags");
    }

    let dbClient = await new mongoClient(dbURI).connect();

    let dbPlaylist = await dbClient.db("SNM").collection("playlists").findOne({_id:{name:playlist.name,owner:playlist.owner}});
    let items;
    if (dbPlaylist == null){
        playlist._id = {name:playlist.name, owner:playlist.owner};
        delete playlist.name;
        delete playlist.owner;
        items = await dbClient.db("SNM").collection('playlists').insertOne(playlist);

        return res.json(items);
    }

    res.status(400).send("Playlist dell'utente " + playlist.owner + " già presente");
});

module.exports = router