# -*- coding: utf-8 -*-
"""PER-SONG DATA: the reconciled lyric line table + song metadata used by the transcribe_*.py tools.

This copy holds the 残光 case study as a worked example. For a new song REPLACE everything in this file
(keep the names): LINES (one entry per sung line, official text + hiragana reading + a rough start from a
Whisper pass), SONG, START_OVERRIDE / MORA_OVERRIDE (empty until you verified an onset by ear) and SCORE_TESTS.
Translations / hand-checked romaji live in transcribe_translation.py.

Each LINES entry: (text, reading_hiragana, section, approx_start_from_whisper, confidence, alternatives, note)
Text was reconciled from 9 faster-whisper large-v3 passes (see examples/zanko/LYRICS_NOTES.md in the kit repo) and
forced-decoding scores (tools/transcribe_score.py).

  python tools/transcribe_lines.py      print the table (index, start, section, text, reading)
Author: NikusonP -- vocaloid-style-mv-pipeline, MIT licence.
"""

# The per-song table lives in analysis/lyrics_lines.json (kept OUT of git: it holds the full lyric text of a song we
# do not own). Keys: LINES [[text, reading, section, approx_start, confidence, alternatives, note], ...], SONG,
# START_OVERRIDE {"index": [start, source]}, MORA_OVERRIDE {"index": {"mora": start}}, SCORE_TESTS [[name, a, b, [texts]]].
import json as _json
import os as _os
_DATA = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "analysis", "lyrics_lines.json")
if _os.path.exists(_DATA):
    _d = _json.load(open(_DATA, encoding="utf-8"))
else:   # no local lyric table yet: empty (fill analysis/lyrics_lines.json, see references/03 section 9)
    _d = dict(LINES=[], SONG=dict(title="", language="ja", wordless_vocal_regions=[], instrumental_breaks=[]),
              START_OVERRIDE={}, MORA_OVERRIDE={}, SCORE_TESTS=[])
LINES = [tuple(x) for x in _d["LINES"]]
SONG = _d["SONG"]
START_OVERRIDE = {int(k): tuple(v) for k, v in _d.get("START_OVERRIDE", {}).items()}
MORA_OVERRIDE = {int(k): {int(m): t for m, t in v.items()} for k, v in _d.get("MORA_OVERRIDE", {}).items()}
SCORE_TESTS = [tuple(x) for x in _d.get("SCORE_TESTS", [])]


if __name__ == "__main__":
    import argparse
    import sys
    argparse.ArgumentParser(description="Print the per-song lyric line table (see the module docstring).").parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"{SONG.get('title', '?')}: {len(LINES)} lines")
    for i, (text, reading, sec, st, conf, *_rest) in enumerate(LINES):
        print(f"{i:3d} {st:7.2f}  {sec:10s} {conf:.2f}  {text}  ({reading})")
