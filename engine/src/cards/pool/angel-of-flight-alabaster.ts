import { defineCard } from "../define.js";

export default defineCard({
  name: "Angel of Flight Alabaster",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, return target Spirit card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Spirit" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "At the beginning of your upkeep, return target Spirit card from your graveyard to your hand.",
    },
  ],
});
