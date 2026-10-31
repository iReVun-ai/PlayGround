# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/iReVun-ai/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/iReVun-ai/PlayGround)

- 🎮 [Open the project](https://omgithub.com/iReVun-ai/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=iReVun-ai%2FPlayGround).
- 💻 [Explore the source](https://github.com/iReVun-ai/PlayGround).
- 🛠️ [Check build runs](https://github.com/iReVun-ai/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/iReVun-ai/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/iReVun-ai).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

## ZERO POINT — 24-zone duel puzzle

A browser puzzle duel inspired by classic card games. The board is a **24-zone field**
(5 monster zones + 5 spell/trap zones + deck + graveyard per side). Reduce the
opponent's LP to 0 in the shortest number of actions, using face-down defense sets,
flip effects, and traps that fire from the opponent's turn.

- 8 stages, each with an authored **par** (shortest line) and a one-click optimal replay.
- Speedrun timer, three-star scoring, and local best records.
- Original cards and CSS/emoji art; no third-party assets.
- Works on desktop and mobile, with portrait and landscape layouts.

Run it with any static server, for example:

```bash
python3 -m http.server 3002
```

Useful checks:

```bash
node tools/verify.cjs      # authored solutions must win at par
node tools/solve.cjs       # search for shorter solutions
node tools/fuzz.cjs        # random-play engine robustness
```
