import { defineCard } from "../define.js";

export default defineCard({
  name: "Plagued Rusalka",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{B}, Sacrifice a creature: Target creature gets -1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, Sacrifice a creature: Target creature gets -1/-1 until end of turn.",
    },
  ],
});
