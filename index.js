const express = require('express');
const cors = require('cors');
const mongoClient = require('mongodb').MongoClient;
const {log} = require('console');
require('dotenv').config();
const spotifyInteraction = require('./src/helpers/spotifyAPIInteraction');
const dbURI = process.env.DB_URI;
const logRoute = require('./src/middlewares/logRoute');

const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("./src/swagger-output.json");

const app = express();
const router = express.Router();

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const artistsRoutes = require('./src/routes/artistsRoutes');
const genresRoutes = require('./src/routes/genresRoutes');
const songsRoutes = require('./src/routes/songsRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');
const publicPlaylistsRoutes = require('./src/routes/publicPlaylistsRoutes');

app.use(cors());
app.use(express.json());
app.use(logRoute);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/artists', artistsRoutes);
router.use('/genres', genresRoutes);
router.use('/songs', songsRoutes);
router.use('/playlist', playlistRoutes);
router.use('/publicPlaylists', publicPlaylistsRoutes);

app.use('/api', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3100, "0.0.0.0", async () => {
    log("Server partito sulla porta 3100.");
    let dbClient;

    spotifyInteraction.requestAuthorizationId()
        .then(async (response) => {
            dbClient = await new mongoClient(dbURI).connect();
            await spotifyInteraction.requestAndMemorizeGenres(dbClient);
        })
        .then(async (response) => {
            dbClient = await new mongoClient(dbURI).connect();
            await spotifyInteraction.requestAndMemorizeSongs(dbClient);
        })
        .then(async (response) => {
            dbClient = await new mongoClient(dbURI).connect();
            await spotifyInteraction.memorizeArtists(dbClient);
        })
        .catch((e) => console.log(e));
});


