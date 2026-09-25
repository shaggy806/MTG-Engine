import { defineCard } from "../define.js";

export default defineCard({
  name: "Raccoon Rallier",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Raccoon", "Bard"],
  power: 2,
  toughness: 2,
  text: "{T}: Target creature you control gains haste until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature you control gains haste until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
