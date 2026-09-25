import { defineCard } from "../define.js";

export default defineCard({
  name: "Archangel of Thune",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "lifelink"],
  text: "Flying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)\nWhenever you gain life, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Whenever you gain life, put a +1/+1 counter on each creature you control.",
    },
  ],
});
