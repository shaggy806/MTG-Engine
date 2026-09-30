import { defineCard } from "../define.js";

const TEXT = "At the beginning of each player's draw step, that player draws an additional card.";

export default defineCard({
  name: "Kami of the Crescent Moon",
  manaCost: "{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
