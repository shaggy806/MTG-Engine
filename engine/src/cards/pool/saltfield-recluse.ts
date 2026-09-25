import { defineCard } from "../define.js";

export default defineCard({
  name: "Saltfield Recluse",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Rebel", "Cleric"],
  power: 1,
  toughness: 2,
  text: "{T}: Target creature gets -2/-0 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets -2/-0 until end of turn.",
    },
  ],
});
