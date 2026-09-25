import { defineCard } from "../define.js";

export default defineCard({
  name: "Disciple of Tevesh Szat",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 1,
  text: "{T}: Target creature gets -1/-1 until end of turn.\n{4}{B}{B}, {T}, Sacrifice this creature: Target creature gets -6/-6 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets -1/-1 until end of turn.",
    },
    {
      cost: { mana: "{4}{B}{B}", tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -6, toughness: -6, duration: "end-of-turn" },
      resolve: null,
      text: "{4}{B}{B}, {T}, Sacrifice this creature: Target creature gets -6/-6 until end of turn.",
    },
  ],
});
