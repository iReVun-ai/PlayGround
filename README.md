# LP TO 0 — 24 ZONE CARD DUEL

`11ai'ame` と `H大好き分岐ｵﾚ` が、LP 4000 を賭けて戦う 1 VS 1 のカードデュエルゲーム。

モンスターを召喚・セットし、魔法・罠を駆使して相手の LP を 0 にせよ。盤面は各デュエリスト 12 ゾーン、合計 24 ゾーン。

## Play

`index.html` をブラウザで開くだけで遊べます。ローカルサーバーを使う場合:

```bash
python3 -m http.server 3000
# http://localhost:3000
```

## Rules

- 初期 LP は 4000。相手の LP を 0 にするか、相手のデッキを 0 枚にすれば勝利。
- 自分のフィールドはモンスター 6 ゾーン + 魔法・罠 6 ゾーン。
- モンスターは 1 ターンに 1 体まで召喚・セット可能。Lv5・6 は生贄 1 体、Lv7 以上は生贄 2 体が必要。
- 攻撃表示のモンスターで攻撃。相手モンスターがいなければ直接攻撃。
- 伏せた罠は条件を満たすと自動発動。伏せた魔法は次のターン以降に発動可能。
- デッキは 24 枚。手札上限は 8 枚。デッキ切れは敗北。

## Controls

- 手札をタップ / クリックしてカードを選択。
- 表示されたコマンドで召喚・セット・発動。
- ゾーンをタップして配置、攻撃対象を選択。
- キーボード: `1`〜`8` で手札選択、`Esc` でキャンセル。
- 右上のボタンでデュエルログ、遊び方、サウンド、リスタート。
- 各デュエリストの GY 表示をタップすると墓地を確認できます。

## Tech

フレームワーク・ビルド不要の静的アプリです。HTML / CSS / JavaScript のみで動作し、レスポンシブなタッチ操作とモバイル横向きレイアウトに対応しています。

---

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
