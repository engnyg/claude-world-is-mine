# media — rendered films (private)

ワールドイズマイン fan MV, 1920×1080, 60 fps, H.264 + AAC, 4:16.6.

**This branch contains the original song audio and the on-screen lyrics. Keep this repository private; do not make it
public or merge this branch into the code branch.**

The film is split into 10 playable parts (each under GitHub's 100 MB file limit) in `1080p60/`.

Join them into one file (no re-encode):

```bash
cd 1080p60
ffmpeg -f concat -safe 0 -i concat.txt -c copy mv_1080p60.mp4
```

Check the downloads: `sha256sum -c SHA256SUMS`.
