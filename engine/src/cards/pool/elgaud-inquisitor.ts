import { defineCard } from "../define.js";

export default defineCard({
  name: "Elgaud Inquisitor",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)\nWhen this creature dies, create a 1/1 white Spirit creature token with flying.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Spirit creature token with flying.",
    },
  ],
});
