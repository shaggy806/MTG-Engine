import { defineCard } from "../define.js";

export default defineCard({
  name: "Prakhata Pillar-Bug",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 3,
  text: "{B}: This creature gains lifelink until end of turn. (Damage dealt by this creature also causes you to gain that much life.)",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gains lifelink until end of turn.",
    },
  ],
});
