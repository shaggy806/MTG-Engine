import { defineCard } from "../define.js";

export default defineCard({
  name: "Reya Dawnbringer",
  manaCost: "{6}{W}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, you may return target creature card from your graveyard to the battlefield.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Return target creature card from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may return target creature card from your graveyard to the battlefield.",
    },
  ],
});
