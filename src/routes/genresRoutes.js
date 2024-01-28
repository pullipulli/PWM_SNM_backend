const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()

router.get("/", async (req, res) => {
    // #swagger.tags = ['genres']
    // #swagger.summary = 'Viene restituito un array che contiene tutti i generi musicali memorizzati nel database'
    let dbClient = await new mongoClient(dbURI).connect();
    let genres = await dbClient.db("SNM").collection("genres").find().sort({_id: 1}).toArray();

    await dbClient.close();

    if (genres != null)
        return res.json(genres);
    res.status(404).send("Genres not found");
});

module.exports = router