import { defineCard } from "../define.js";

const TEXT = "If you would draw a card while your library has no cards in it, you win the game instead.";

// A replacement of the draw (rule 614.11 — it applies though there's no card
// to draw), applied in `Game.drawCard`. A player who can't win (an
// opponent's Platinum Angel) has the draw replaced all the same, and so
// doesn't lose for it (the ruling).
export default defineCard({
  name: "Laboratory Maniac",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-draw", who: "you", instead: "win-game", whileLibraryEmpty: true },
      text: TEXT,
    },
  ],
});
