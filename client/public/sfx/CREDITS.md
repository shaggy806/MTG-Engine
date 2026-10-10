# Sound effects

Each file here is played by `client/src/game/sound.ts` (its `SAMPLES` table). Converted from the
packs' OGG to MP3 (96 kbps; plays in every browser) and normalised to -29 LUFS at its loudest
moment, so `sound.ts` sets one level for all of them.

| Files | Source | License |
|---|---|---|
| `card-fan-*`, `card-place-*`, `card-shove-*`, `card-shuffle`, `card-slide-*`, `chip-lay-*` | [Casino Audio](https://kenney.nl/assets/casino-audio) 1.1 by Kenney (`card-shuffle` trimmed to its first 2 s) | CC0 |
| `click_003` (any button) | [Interface Sounds](https://kenney.nl/assets/interface-sounds) 1.0 by Kenney (at the same loudness the earlier click_001 had, -32 LUFS) | CC0 |
| `blow-smoke` (a permanent exiled) | [blow smoke](https://freesound.org/people/dreggsome/sounds/795416/) by dreggsome, on Freesound (from the 24-bit WAV; cut to 0.47–1.75 s with a fade, to line up with the exile animation) | CC0 |
| `grunt-death` (a creature dying) | [Grunt2 - Death Pain.wav](https://freesound.org/people/tonsil5/sounds/416838/) by tonsil5, on Freesound (from the 24-bit WAV; silence and its noise tail trimmed) | CC0 |
| `breaking` (any other permanent leaving the battlefield, but for exile) | `bfh1_breaking_03` from [75 CC0 breaking / falling / hit sfx](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx) by rubberduck, on OpenGameArt | CC0 |
| `sparkle` (life gained) | [cartoon_wink_magic_sparkle.wav](https://freesound.org/people/MLaudio/sounds/511485/) by MLaudio, on Freesound (from the WAV; its quiet tail kept) | CC0 |
| `sparkle-reversed` (life lost) | The same sparkle, reversed: its last 0.5 s, a swell that snaps shut | CC0 |
| `thud` (a nonland permanent entering) | [thud.wav](https://freesound.org/people/OtisJames/sounds/215162/) by OtisJames, on Freesound (from the WAV) | CC0 |
| `whoosh` (an ability going on the stack) | [Whoosh](https://freesound.org/people/qubodup/sounds/60013/) by qubodup, on Freesound (from the FLAC) | CC0 |
| `energy-drain` (a spell countered or fizzling) | [Energy Drain](https://opengameart.org/content/energy-drain) by qubodup, on OpenGameArt (from the FLAC; cut to 1.8 s with a fade, the reverb's tail past that inaudible). The `license.txt` in its download is CC-BY-SA 3.0 from 2012; the page relicensed it CC0 on 2024-06-23 and says the download's restrictions can be ignored. Credit asked: "Just mention: qubodup". | CC0 |
| `sword-*`, `sword-clash-*` | [20 Sword Sound Effects (Attacks and Clashes)](https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes) by [StarNinjas](https://opengameart.org/users/starninjas), on OpenGameArt (silence trimmed from each end) | CC0 |
| `hit-*` (combat damage) | [37 hits/punches](https://opengameart.org/content/37-hitspunches) by Independent.nu, submitted to OpenGameArt by qubodup (hits 25–29 and 32, from the FLACs; silence trimmed from each end) | CC0 |
| `game-start` (a turn beginning), `card-tap`, `card-untap`, `roll-die` | `cuckoo.wav`, `tap.wav`, `untap.wav` and `rolldie.wav` from [Card Game sounds](https://opengameart.org/content/card-game-sounds) by HaelDB, made for Cockatrice, on OpenGameArt: `cuckoo.wav` is the pack's "Game Start" (matched to the page's preview by its envelope; the zip doesn't name it) | CC0 |
| `surprise-defeat` (losing) | [A surprising twist (NES sting)](https://opengameart.org/content/a-surprising-twist-nes-sting) by congusbongus, on OpenGameArt. Its last note is cut off mid-sustain in the original, so here it fades at 3.3 s into a reverb-like tail of echoes (37–401 ms) decaying over about a second (128 kbps) | CC0 |
| `newthingget` (the victory tune) | [New thing get!](https://opengameart.org/content/new-thing-get) by congusbongus, on OpenGameArt (128 kbps) | CC0 |
