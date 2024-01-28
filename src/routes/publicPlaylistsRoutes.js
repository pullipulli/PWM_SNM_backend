const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()

router.get("/", async (req, res) => {
    // #swagger.tags = ['playlists']
    // #swagger.summary = 'Vengono restituite tutte le playlist pubbliche che sono all'interno del database'
    let dbClient = await new mongoClient(dbURI).connect();

    let playlists = await dbClient.db("SNM").collection("playlists").find({
            privacy: "public"
        }
    ).toArray();

    await dbClient.close();

    res.json(playlists);
});

module.exports = router