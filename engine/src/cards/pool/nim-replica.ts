import { defineCard } from "../define.js";

export default defineCard({
  name: "Nim Replica",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 1,
  text: "{2}{B}, Sacrifice this creature: Target creature gets -1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{B}, Sacrifice this creature: Target creature gets -1/-1 until end of turn.",
    },
  ],
});
