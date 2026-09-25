import { defineCard } from "../define.js";

export default defineCard({
  name: "Bog Naughty",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{2}{B}, Sacrifice a Food: Target creature gets -3/-3 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: { filter: { subtype: "Food" } } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{B}, Sacrifice a Food: Target creature gets -3/-3 until end of turn.",
    },
  ],
});
