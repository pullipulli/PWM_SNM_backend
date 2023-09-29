const express = require('express');
const cors = require('cors');
const mongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');
const { log } = require('console');
const spotifyInteraction = require('./helpers/spotifyAPIInteraction');
require('dotenv').config();
const dbURI = process.env.DB_URI;

function memorizeArtists(dbClient) {
    dbClient.db("SNM").collection("songs").find().project({_id:0,song:{artists:1}}).toArray().then(
        async (result) => {
            for(let i = 0; i < result.length; i++) {
                let artists = result[i].song.artists;
                for (let j = 0; j < artists.length; j++) {
                    let artist = artists[j];
                    let artistId = artist.id;
                    let oldArtist = await dbClient.db("SNM").collection('artists').findOne({_id:artistId});
                    if (oldArtist == null)
                        await dbClient.db("SNM").collection("artists").insertOne({_id:artistId, artist:artist});
                }
            }

            
        }
    );
}

function hash(input) {
    return crypto.createHash('md5')
        .update(input)
        .digest('hex')
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/users', async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect()
    let users = await dbClient.db("SNM").collection('users').find().project({ "password": 0 }).toArray();
    
    return res.json(users);
});

app.get('/users/:id', async(req, res) => {
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
        res.status(404).send("User not found");
    else return res.json(requestedUser);
});

app.put("/users/:id", async (req, res) => {
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

app.delete("/users/:id", async (req, res) => {
    let id = req.params.id;

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

app.post("/login", async (req, res) => {
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
        ]
    }
    let loggedUser = await dbClient.db("SNM")
        .collection('users')
        .findOne(filter);

    if (loggedUser == null) 
        res.status(401).send("Utente non autorizzato.");
    else return res.json(loggedUser);
});

app.post('/register', async (req, res) => {
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

    if (login.favouriteArtists === undefined) {
        res.status(400).send("Missing Artist Preferences");
        return;
    }

    if (login.favouriteGenres === undefined) {
        res.status(400).send("Missing Genre Preferences");
        return;
    }

    login.password = hash(login.password);

    let dbClient = await new mongoClient(dbURI).connect();

    let user = await dbClient.db("SNM").collection("users").findOne({"username": login.username, "email":login.email});
    let items;
    if (user == null){
        items = await dbClient.db("SNM").collection('users').insertOne(login);
        
        return res.json(items);
    }
    
    res.status(400).send("Utente già presente");
});

app.get("/artists", async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect();
    let artists = await dbClient.db("SNM").collection("artists").find().sort('artist.name').toArray();
    
    if (artists != null)
        return res.json(artists);
    res.status(404).send("Artists not found");
});

app.get("/genres", async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect();
    let genres = await dbClient.db("SNM").collection("genres").find().sort({_id:1}).toArray();
    
    if (genres != null)
        return res.json(genres);
    res.status(404).send("Genres not found");
});

app.get("/songs", async (req, res) => {
    let dbClient = await new mongoClient(dbURI).connect();
    let songs = await dbClient.db("SNM").collection("songs").find().toArray();
    
    if (songs != null)
        return res.json(songs);
    res.status(404).send("Songs not found");
});

app.get("/songs/:id", async (req, res) => {
    let id = req.params.id;
    let dbClient = await new mongoClient(dbURI).connect();
    let song = await dbClient.db("SNM").collection("songs").find({"_id":id}).toArray();
    
    if (song != null)
        return res.json(song);
    res.status(404).send("Song not found");
});

app.post("/playlist", async (req, res) => {
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
}
)

app.listen(3100, "0.0.0.0", async () => {
    log("Server partito sulla porta 3100.");
    let dbClient;

    dbClient = await new mongoClient(dbURI).connect();

    spotifyInteraction.requestAuthorizationId()
    .then((response) => {
        spotifyInteraction.requestAndMemorizeGenres(dbClient);
    })
    .then((response) => {
        spotifyInteraction.requestAndMemorizeSongs(dbClient);
    })
    .then(async (response) => {
        memorizeArtists(dbClient);
    })
    .catch((e) => console.log(e));
});


