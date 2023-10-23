const fetch = require("node-fetch");
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
let spotifyAuthorizationID;

function requestAuthorizationId() {
    return fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: "Basic " + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({grant_type: "client_credentials"}),
    })
        .then((response) => response.json())
        .then((tokenResponse) => {
            spotifyAuthorizationID = tokenResponse.access_token
        }).catch((e) => console.log(e));
}


function requestAndMemorizeGenres(dbClient) {
    return fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + spotifyAuthorizationID
        }
    })
        .then((response) => response.json())
        .then(async (genres) => {
            genres = genres.genres;

            for (let i = 0; i < genres.length; i++) {
                let genre = genres[i];
                let oldGenre = await dbClient.db("SNM").collection('genres').findOne({_id: genre});
                if (oldGenre == null)
                    await dbClient.db("SNM").collection('genres').insertOne({_id: genre});
            }
        })
        .catch((e) => console.log(e))
        .finally(() => dbClient.close());
}

function requestAndMemorizeSongs(dbClient) {
    let limit = 100;
    let market = 'IT';
    let genres = 'punk-rock,rock,rock-n-roll,metal,metal-misc';
    return fetch(`https://api.spotify.com/v1/recommendations?limit=${limit}&market=${market}&seed_genres=${genres}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + spotifyAuthorizationID
        }
    })
        .then(response => response.json())
        .then(async songs => {

            songs = songs.tracks;

            for (let i = 0; i < 100; i++) {
                let song = songs[i];
                let songId = song.id;
                let oldSong = await dbClient.db("SNM").collection('songs').findOne({_id: songId});
                if (oldSong == null)
                    await dbClient.db("SNM").collection('songs').insertOne({_id: songId, song: song});
            }
        }).catch(e => console.log(e))
        .finally(() => dbClient.close());
}

function memorizeArtists(dbClient) {
    dbClient.db("SNM").collection("songs").find().project({_id: 0, song: {artists: 1}}).toArray().then(
        async (result) => {
            for (let i = 0; i < result.length; i++) {
                let artists = result[i].song.artists;
                for (let j = 0; j < artists.length; j++) {
                    let artist = artists[j];
                    let artistId = artist.id;
                    let oldArtist = await dbClient.db("SNM").collection('artists').findOne({_id: artistId});
                    if (oldArtist == null)
                        await dbClient.db("SNM").collection("artists").insertOne({_id: artistId, artist: artist});
                }
            }
        }
    ).finally(() => dbClient.close());
}

module.exports = {requestAndMemorizeGenres, requestAuthorizationId, requestAndMemorizeSongs, memorizeArtists};