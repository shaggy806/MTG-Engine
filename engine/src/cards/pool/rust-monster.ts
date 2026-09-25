import { defineCard } from "../define.js";

export default defineCard({
  name: "Rust Monster",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\nSacrifice an artifact: This creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an artifact: This creature gets +2/+0 until end of turn.",
    },
  ],
});
