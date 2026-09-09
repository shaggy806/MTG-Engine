import { defineCard } from "../define.js";

export default defineCard({
  name: "World Shaper",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Shaman"],
  power: 3,
  toughness: 3,
  text:
    "Whenever World Shaper attacks, you may mill three cards.\n" +
    "When World Shaper dies, return all land cards from your graveyard to the " +
    "battlefield tapped.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Mill three cards?",
        effect: { kind: "mill", target: "you", amount: 3 },
      },
      resolve: null,
      text: "Whenever World Shaper attacks, you may mill three cards.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "return-from-graveyard",
        filter: { type: "land" },
        destination: "battlefield",
        count: "all",
        enterTapped: true,
      },
      resolve: null,
      text:
        "When World Shaper dies, return all land cards from your graveyard to " +
        "the battlefield tapped.",
    },
  ],
});
