const fetch = require("node-fetch");
const spotifyClientId = "b363b238785c48ec9f070b71a2afb11b";
const spotifyClientSecret = "285848df0c6b4ecbaa4c14d63bb24424";
let spotifyAuthorizationID;

function requestAuthorizationId() {
    return fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: "Basic " + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
    })
    .then((response) => response.json())
    .then((tokenResponse) => {
        spotifyAuthorizationID = tokenResponse.access_token
    }).catch((e)=>console.log(e));
}


function requestAndMemorizeGenres(dbClient) {
    return fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
        method: "GET",
        headers: {
            "Content-Type":"application/json",
            "Authorization" : "Bearer " + spotifyAuthorizationID
        }
    })
    .then((response) => response.json())
    .then(async (genres) => {
        genres = genres.genres;

        for (let i = 0; i < genres.length; i++) {
            let genre = genres[i];
            let oldGenre = await dbClient.db("SNM").collection('genres').findOne({_id:genre});
            if (oldGenre == null)
                await dbClient.db("SNM").collection('genres').insertOne({_id:genre});
        }
    })
    .catch((e) => console.log(e));
}

function requestAndMemorizeSongs(dbClient) {
    let limit = 100;
    let market = 'IT';
    let genres = 'punk-rock,rock,rock-n-roll,metal,metal-misc';
    return fetch(`https://api.spotify.com/v1/recommendations?limit=${limit}&market=${market}&seed_genres=${genres}`, {
        method: "GET",
        headers: {
            "Content-Type":"application/json",
            "Authorization":"Bearer " + spotifyAuthorizationID
        }
    })
    .then(response => response.json())
    .then(async songs => {
        
        songs = songs.tracks;

        for (let i = 0; i < 100; i++) {
            let song = songs[i];
            let songId = song.id;
            let oldSong = await dbClient.db("SNM").collection('songs').findOne({_id:songId});
            if (oldSong == null)
                await dbClient.db("SNM").collection('songs').insertOne({_id:songId, song:song});
        }
    }).catch(e => console.log(e));
}

module.exports = {requestAndMemorizeGenres, requestAuthorizationId, requestAndMemorizeSongs};