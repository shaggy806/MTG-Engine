import { defineCard } from "../define.js";

export default defineCard({
  name: "Agent of Shauku",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary"],
  power: 1,
  toughness: 1,
  text: "{1}{B}, Sacrifice a land: Target creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{B}, Sacrifice a land: Target creature gets +2/+0 until end of turn.",
    },
  ],
});
