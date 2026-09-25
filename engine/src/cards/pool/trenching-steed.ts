import { defineCard } from "../define.js";

export default defineCard({
  name: "Trenching Steed",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Horse", "Rebel"],
  power: 2,
  toughness: 3,
  text: "Sacrifice a land: This creature gets +0/+3 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a land: This creature gets +0/+3 until end of turn.",
    },
  ],
});
