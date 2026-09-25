import { defineCard } from "../define.js";

export default defineCard({
  name: "Savage Gorilla",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ape"],
  power: 3,
  toughness: 3,
  text: "{U}{B}, {T}, Sacrifice this creature: Target creature gets -3/-3 until end of turn. Draw a card.",
  activated: [
    {
      cost: { mana: "{U}{B}", tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "{U}{B}, {T}, Sacrifice this creature: Target creature gets -3/-3 until end of turn. Draw a card.",
    },
  ],
});
