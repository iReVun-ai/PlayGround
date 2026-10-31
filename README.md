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

## ZONE XII — 六大六小の決闘

**ZONE XII** は、六大六小・十二ゾーンで戦うブラウザ用カードデュエルです。相手のライフポイントを **0** にすれば勝利。デッキ切れ負けはなく、山札が尽きると墓地をシャッフルして再利用します。

### ルール

- 各プレイヤーは **BIGゾーン6つ**（モンスター）と **SMALLゾーン6つ**（リリック）を持つ。
- 初期LPは **3000**。山札は30枚（モンスター15枚／リリック15枚）、開始手札は5枚。
- 自分のターン開始時に1枚ドロー。1ターンに **召喚1体** と **設置1枚**。
- 場のカードは1ターンに1回ずつ **ACT** を使える。モンスターはACTとは別に1回攻撃できる。
- 召喚したターンのモンスターは攻撃できない（ACTは使用可能）。
- 戦闘はATKの比較。高い方が生き残り、低い方が破壊され、差分が敗者のLPへのダメージになる。同値なら両者破壊。相手モンスターがいない場合はATKぶんの直接攻撃。
- 22種類すべてのカードに固有のACTがある。

### 操作

1. 手札のカードをタップして選択。
2. 下部のコマンドから「召喚する」「設置する」「ACT」「攻撃」を実行。
3. 召喚・設置は空きゾーンを直接タップして置くことも可能。
4. 攻撃時は赤く光る相手モンスターをタップ。戦闘結果はカード上にプレビュー表示される。
5. 自分のターンを終えるときは「ターン終了」。`Esc` で選択をキャンセル。

スマートフォン・タブレットのタッチ操作と、縦向き／横向きのレイアウトに対応しています。サウンドは右上の ♪ ボタンで切り替えられます。

### 起動

ビルド工程はありません。ES Modules を配信できる静的サーバーでこのディレクトリを公開してください。

```bash
# 例
python3 -m http.server 8000
# → http://localhost:8000/
```

プラットフォーム上では `./start.sh` から起動できます。
