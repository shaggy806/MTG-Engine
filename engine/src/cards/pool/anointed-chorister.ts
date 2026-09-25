import { defineCard } from "../define.js";

export default defineCard({
  name: "Anointed Chorister",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)\n{4}{W}: This creature gets +3/+3 until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{4}{W}: This creature gets +3/+3 until end of turn.",
    },
  ],
});
