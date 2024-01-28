const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Social Network for Music API',
        description: 'API del sito web Social Network for Music (PWM_SNM)'
    },
    tags: [
        {
            name: 'artists',
            description: 'Route legate agli artisti'
        },
        {
            name: 'auth',
            description: 'Route legate all\'autenticazione degli utenti'
        },
        {
            name: 'genres',
            description: 'Route legate ai generi musicali'
        },
        {
            name: 'playlists',
            description: 'Route legate alle playlist (pubbliche o private che siano)'
        },
        {
            name: 'songs',
            description: 'Route legate alle canzoni'
        },
        {
            name: 'user',
            description: 'Route legate agli utenti dell\'applicativo'
        },
    ],
    host: 'localhost:3100'
};

const outputFile = './swagger-output.json';
const routes = ['./index.js'];

swaggerAutogen(outputFile, routes, doc)
    .then(() => {
        console.log("Documentazione dell'API generata!")
    });