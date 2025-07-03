const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    if (req.method === 'GET' && req.url === "/artists") {
      const resBody = JSON.stringify(artists);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.write(resBody);
      return res.end();
    }

    if (req.method === 'GET' && req.url.startsWith("/artists/")) {
      const urlParts = req.url.split('/');
      const artistId = urlParts[2];
      if (Object.keys(artists).includes(artistId)) {
        if (urlParts.length === 3) {
          const artist = JSON.parse(JSON.stringify(artists[artistId]));
          artist.albums = Object.values(albums).filter(album => album.artistId === artist.artistId);

          const resBody = JSON.stringify(artist);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(resBody);
          return res.end();
        }

        if (urlParts.length === 4 && urlParts[3] === 'albums') {
          const artistAlbums = Object.values(albums).filter(album => album.artistId === Number(artistId));

          const resBody = JSON.stringify(artistAlbums);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(resBody);
          return res.end();
        }

        if (urlParts.length === 4 && urlParts[3] === "songs") {
          const artistSongs = Object.values(songs).filter(song => albums[`${song.albumId}`].artistId === Number(artistId));

          const resBody = JSON.stringify(artistSongs);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(resBody);
          return res.end();
        }
      }
    }

    if (req.method === 'POST' && req.url === '/artists') {
      const { name } = req.body;
      const artistId = getNewArtistId();
      const artist = {
        name: name,
        artistId: artistId
      };

      artists[`${artistId}`] = artist;

      const resBody = JSON.stringify(artist);

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.write(resBody);
      return res.end();
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const { name } = req.body;
        const artistId = urlParts[2];

        artists[artistId].name = name;

        const artist = artists[artistId];
        const resBody = JSON.stringify({
          name: artist.name,
          artistId: artist.artistId,
          updatedAt: (new Date()).toISOString()
        });

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(resBody);
        return res.end();
      }
    }

    if (req.method === 'DELETE' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const artistId = urlParts[2];

        delete artists[artistId];

        const resBody = JSON.stringify({
          "message": "Successfully deleted"
        });

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(resBody);
        return res.end();
      }
    }

    if (req.method === 'GET' && req.url.startsWith('/albums/')) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const albumId = urlParts[2];

        const album = JSON.parse(JSON.stringify(albums[albumId]));
        album.artist = artists[`${album.artistId}`];
        album.songs = Object.values(songs).filter(song => song.albumId === album.albumId);

        const resBody = JSON.stringify(album);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(resBody);
        return res.end();
      }

      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const albumId = urlParts[2];

        const resBody = JSON.stringify(Object.values(songs).filter(song => song.albumId === Number(albumId)));

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(resBody);
        return res.end();
      }
    }

    if (req.method === 'POST' && req.url.startsWith("/artists/")) {
      const urlParts = req.url.split('/');
      const artistId = urlParts[2];

      if (Object.keys(artists).includes(artistId)) {
        if (urlParts.length === 4 && urlParts[3] === "albums") {
          const { name } = req.body;
          const album = {
            albumId: getNewAlbumId(),
            name: name,
            artistId: Number(artistId)
          }

          albums[`${album.albumId}`] = album;

          const resBody = JSON.stringify(albums[`${album.albumId}`]);

          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.write(resBody);
          return res.end();
        }
      }
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith("/albums/")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        if (Object.keys(albums).includes(albumId)) {
          const { name } = req.body;

          albums[albumId].name = name;
          const album = albums[albumId];

          const resBody = JSON.stringify({
            name: album.name,
            albumId: album.albumId,
            artistId: album.artistId,
            updatedAt: (new Date()).toISOString()
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(resBody);
          return res.end();
        }
      }
    }

    if (req.method === 'DELETE' && req.url.startsWith("/albums")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        if (Object.keys(albums).includes(albumId)) {
          delete albums[albumId];

          const resBody = JSON.stringify({
            "message": "Successfully deleted"
          });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(resBody);
          return res.end();
        }
      }
    }

    if (req.method === 'GET' && req.url.startsWith("/trackNumbers/")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const trackNumber = urlParts[2];

        const resBody = JSON.stringify(Object.values(songs).filter(song => song.trackNumber === Number(trackNumber)));

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json')
        res.write(resBody);
        return res.end();
      }
    }

    if (req.method === 'GET' && req.url.startsWith("/songs/")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const songId = urlParts[2];

        const song = JSON.parse(JSON.stringify(songs[songId]));
        song.album = albums[`${song.albumId}`];
        song.artist = artists[`${song.album.albumId}`];

        const resBody = JSON.stringify(song);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(resBody);
        return res.end();
      }
    }

    if (req.method === 'POST' && req.url.startsWith("/albums/")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const albumId = urlParts[2];
        if (Object.keys(albums).includes(albumId)) {
          const { name, lyrics, trackNumber } = req.body;

          const song = {
            name: name,
            lyrics: lyrics,
            trackNumber: trackNumber,
            songId: getNewSongId(),
            albumId: Number(albumId)
          }

          songs[`${song.songId}`] = song;

          const resBody = JSON.stringify(songs[`${song.songId}`]);

          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.write(resBody);
          return res.end();
        }
      }
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith("/songs/")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const songId = urlParts[2];
        if (Object.keys(songs).includes(songId)) {
          const { name, lyrics, trackNumber } = req.body;

          if (name) {
            songs[songId].name = name;
          }

          if (lyrics) {
            songs[songId].lyrics = lyrics;
          }

          if (trackNumber || trackNumber === 0) {
            songs[songId].trackNumber = trackNumber;
          }

          const song = songs[songId];

          const resBody = JSON.stringify(song);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(resBody);
          return res.end();
        }
      }
    }

    if (req.method === 'DELETE' && req.url.startsWith("/songs/")) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const songId = urlParts[2];
        if (Object.keys(songs).includes(songId)) {
          delete songs[songId];

          const resBody = JSON.stringify({
            "message": "Successfully deleted"
          });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(resBody);
          return res.end();
        }
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
