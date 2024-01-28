const express = require('express')
const {MongoClient: mongoClient} = require("mongodb");
const dbURI = process.env.DB_URI;
const router = express.Router()

router.get("/:owner/:playlistName", async (req, res) => {
    // #swagger.tags = ['playlists']
    // #swagger.summary = 'Viene restituita una singola playlist (identificata da owner e nome della playlist)'
    const owner = req.params.owner;
    const playlistName = req.params.playlistName;
    const loggedUser = req.headers.authorization;

    if (owner === undefined) return res.status(400).send("Bad request");
    if (playlistName === undefined) return res.status(400).send("Bad request");

    let dbClient = await new mongoClient(dbURI).connect();

    let playlist = await dbClient.db("SNM").collection("playlists").findOne(
        {
            _id: {
                name: playlistName,
                owner: owner
            }
        }
    );

    await dbClient.close();

    if (loggedUser !== owner && playlist.privacy === 'private') return res.status(403).send("Not authorized!");

    res.json(playlist);
});

router.get("/:owner", async (req, res) => {
    // #swagger.tags = ['playlists']
    // #swagger.summary = 'Vengono restituite tutte le playlist dell'owner (solo quelle pubbliche se l'utente loggato non è l'owner)'
    const owner = req.params.owner;
    const loggedUser = req.headers.authorization;

    if (owner === undefined) return res.status(400).send("Bad request");

    let dbClient = await new mongoClient(dbURI).connect();

    let filter = {
        '_id.owner': owner
    };

    if (loggedUser !== owner) filter.privacy = 'public';

    let playlists = await dbClient.db("SNM").collection("playlists").find(filter).toArray();

    await dbClient.close();

    res.json(playlists);
});

function parseTags(stringTags) {
    let tags = stringTags.toString().trim().split('#');

    return tags.filter((tag) => tag.trim() !== "");
}

router.put("/:owner/:name", async (req, res) => {
    // #swagger.tags = ['playlists']
    // #swagger.summary = 'Modifico i dati di una singola playlist'
    const owner = req.params.owner;
    const oldName = req.params.name;
    const loggedUser = req.headers.authorization;

    const newPlaylist = req.body;

    if (owner === undefined) {
        res.status(400).send("Missing UserName of the playlist owner");
        return;
    }

    if (oldName === undefined) {
        res.status(400).send("Missing Playlist Name");
        return;
    }

    newPlaylist.tags = parseTags(newPlaylist.tags);

    try {
        let dbClient = await new mongoClient(dbURI).connect();

        const playlist = await dbClient.db("SNM").collection("playlists").findOne({
            _id: {
                name: oldName,
                owner: owner
            }
        });

        if (playlist.privacy === 'private' && loggedUser !== owner) return res.status(403).send("Not authorized!");

        await dbClient.db("SNM").collection("playlists").deleteOne({
            _id: {
                name: oldName,
                owner: owner
            }
        });


        let items = await dbClient.db("SNM").collection("playlists").insertOne({
            _id: {
                name: newPlaylist.name,
                owner
            },
            songs: newPlaylist.songs,
            privacy: newPlaylist.privacy,
            description: newPlaylist.description,
            tags: newPlaylist.tags
        });

        await dbClient.close();

        return res.json(items);
    } catch (e) {
        console.log(e);
        res.status(404).send("Playlist not found");
    }
});

router.delete("/:owner/:name", async (req, res) => {
    // #swagger.tags = ['playlists']
    // #swagger.summary = 'Elimino una playlist specifica'
    const owner = req.params.owner;
    const name = req.params.name;
    const loggedUser = req.headers.authorization;

    if (owner === undefined) {
        res.status(400).send("Missing UserName of the playlist owner");
        return;
    }

    if (name === undefined) {
        res.status(400).send("Missing Playlist Name");
        return;
    }

    try {
        let dbClient = await new mongoClient(dbURI).connect();

        const playlist = await dbClient.db("SNM").collection("playlists").findOne({
            _id: {
                name: name,
                owner: owner
            }
        });

        if (playlist.privacy === 'private' && loggedUser !== owner) return res.status(403).send("Not authorized!");

        await dbClient.db("SNM").collection("playlists").deleteOne({
            _id: {
                name,
                owner
            }
        });

        await dbClient.close();

        return res.json('OK. Deleted');
    } catch (e) {
        res.status(404).send("Playlist not found");
    }


});

router.post("/", async (req, res) => {
    // #swagger.tags = ['playlists']
    // #swagger.summary = 'Inserisco una nuova playlist'
    let playlist = req.body;
    const loggedUser = req.headers.authorization;

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
        return;
    }

    if (playlist.owner !== loggedUser) return res.status(403).send("Not authorized!");

    playlist.tags = parseTags(playlist.tags);

    let dbClient = await new mongoClient(dbURI).connect();

    let dbPlaylist = await dbClient.db("SNM").collection("playlists").findOne({
        _id: {
            name: playlist.name,
            owner: playlist.owner
        }
    });
    let items;
    if (dbPlaylist == null) {
        playlist._id = {name: playlist.name, owner: playlist.owner};
        delete playlist.name;
        delete playlist.owner;
        items = await dbClient.db("SNM").collection('playlists').insertOne(playlist);

        await dbClient.close();

        return res.json(items);
    }

    res.status(400).send("Playlist dell'utente " + playlist.owner + " già presente");
});

module.exports = router