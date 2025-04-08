const express = require('express');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

app.get('/play', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'query missing' });

    try {
        let video;

        // Check if it's a direct YouTube URL
        if (ytdl.validateURL(query)) {
            const info = await ytdl.getInfo(query);
            video = { videoId: info.videoDetails.videoId, title: info.videoDetails.title };
        } else {
            // Else, search on YouTube
            const result = await yts(query);
            if (!result.videos.length) return res.status(404).json({ error: 'no video found' });
            video = result.videos[0];
        }

        const audioUrl = `http://localhost:${port}/stream/${video.videoId}`;
        res.json({
            title: video.title,
            videoId: video.videoId,
            audio_url: audioUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/stream/:videoId', (req, res) => {
    const videoUrl = `https://www.youtube.com/watch?v=${req.params.videoId}`;
    res.header('Content-Disposition', `attachment; filename="audio.mp3"`);
    ytdl(videoUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
    }).pipe(res);
});

app.listen(port, () => {
    console.log(`YT Proxy running at http://localhost:${port}`);
});
