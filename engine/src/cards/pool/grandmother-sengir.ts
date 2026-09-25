import { defineCard } from "../define.js";

export default defineCard({
  name: "Grandmother Sengir",
  manaCost: "{4}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  text: "{1}{B}, {T}: Target creature gets -1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{B}, {T}: Target creature gets -1/-1 until end of turn.",
    },
  ],
});
