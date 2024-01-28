const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()

router.get("/", async (req, res) => {
    // #swagger.tags = ['artists']
    // #swagger.summary = 'Viene restituito un array che contiene tutti gli artisti memorizzati nel database'
    let dbClient = await new mongoClient(dbURI).connect();
    let artists = await dbClient.db("SNM").collection("artists").find().sort('artist.name').toArray();

    await dbClient.close();

    if (artists != null)
        return res.json(artists);
    res.status(404).send("Artists not found");
});

module.exports = router