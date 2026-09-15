import { defineCard } from "../define.js";

/** A modal double-faced card (creature // land) — its back face, Kazandu
 * Valley, is a land you play instead. `legalActions` offers one option per
 * playable face. */
export default defineCard({
  name: "Kazandu Mammoth",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant"],
  power: 3,
  toughness: 3,
  text: "Landfall — Whenever a land you control enters, Kazandu Mammoth gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, Kazandu Mammoth gets +2/+2 until end " +
        "of turn.",
    },
  ],
  faces: ["Kazandu Mammoth", "Kazandu Valley"],
});
