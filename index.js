const express = require('express');
const cors = require('cors');
const mongoClient = require('mongodb').MongoClient;
const { log } = require('console');
require('dotenv').config();
const spotifyInteraction = require('./src/helpers/spotifyAPIInteraction');
const dbURI = process.env.DB_URI;
const audit = require('express-requests-logger');

const app = express();
const router = express.Router()

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const artistsRoutes = require('./src/routes/artistsRoutes');
const genresRoutes = require('./src/routes/genresRoutes');
const songsRoutes = require('./src/routes/songsRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

app.use(cors());
app.use(express.json());
app.use(audit());

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/artists', artistsRoutes);
router.use('/genres', genresRoutes);
router.use('/songs', songsRoutes);
router.use('/playlist', playlistRoutes);

app.use('/api', router);

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
        spotifyInteraction.memorizeArtists(dbClient);
    })
    .catch((e) => console.log(e));
});


