import { defineCard } from "../define.js";

export default defineCard({
  name: "Stonefare Crocodile",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 3,
  toughness: 2,
  text: "{2}{B}: This creature gains lifelink until end of turn. (Damage dealt by this creature also causes you to gain that much life.)",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: "{2}{B}: This creature gains lifelink until end of turn.",
    },
  ],
});
