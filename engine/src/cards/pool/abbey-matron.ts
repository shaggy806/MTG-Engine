import { defineCard } from "../define.js";

export default defineCard({
  name: "Abbey Matron",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 3,
  text: "{W}, {T}: This creature gets +0/+3 until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{W}, {T}: This creature gets +0/+3 until end of turn.",
    },
  ],
});
