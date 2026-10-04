import { defineCard } from "../define.js";

/** 6/6 blue Whale — the token Reef Worm's Fish makes. */
const TEXT = "When this creature dies, create a 9/9 blue Kraken creature token.";

export default defineCard({
  name: "Whale Token (Reef Worm)",
  art: "51b8f3b4-d0f3-4f2f-8e6f-7da1e852dac1",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Whale"],
  power: 6,
  toughness: 6,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Kraken Token (Spawning Kraken)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
