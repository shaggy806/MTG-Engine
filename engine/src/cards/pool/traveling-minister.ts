import { defineCard } from "../define.js";

export default defineCard({
  name: "Traveling Minister",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{T}: Target creature gets +1/+0 until end of turn. You gain 1 life. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "{T}: Target creature gets +1/+0 until end of turn. You gain 1 life. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
