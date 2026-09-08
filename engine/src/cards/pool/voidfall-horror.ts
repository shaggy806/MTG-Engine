import { defineCard } from "../define.js";

/** ROADMAP Phase 10b — the back face of Nightfall Cultist. */
export default defineCard({
  name: "Voidfall Horror",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 5,
  toughness: 5,
  keywords: ["menace"],
  text: "Menace\nWhen Nightfall Cultist transforms into Voidfall Horror, each opponent loses 2 life.",
  triggered: [
    {
      trigger: { on: "transforms", who: "self", intoFront: false },
      targets: [],
      effect: { kind: "lose-life", who: "each-opponent", amount: 2 },
      resolve: null,
      text: "When Nightfall Cultist transforms into Voidfall Horror, each opponent loses 2 life.",
    },
  ],
  faces: ["Nightfall Cultist", "Voidfall Horror"],
  transform: true,
});
