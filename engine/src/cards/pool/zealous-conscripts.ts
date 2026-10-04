import { defineCard } from "../define.js";

// EDHREC rank 2401. Act of Treason's three steps on an enters trigger, over
// any permanent — one that's untapped or already yours included (the ruling).
const TEXT =
  "When this creature enters, gain control of target permanent until end of turn. Untap that permanent. It gains haste until end of turn.";

export default defineCard({
  name: "Zealous Conscripts",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: `Haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: true },
          { kind: "untap", target: 0 },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
