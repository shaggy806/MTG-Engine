import { defineCard } from "../define.js";

/** 3/3 blue Fish — Reef Worm's token. ("Fish Token" is a different body.) */
const TEXT =
  "When this creature dies, create a 6/6 blue Whale creature token with \"When this creature dies, create a 9/9 blue Kraken creature token.\"";

export default defineCard({
  name: "Fish Token (Reef Worm)",
  art: "e081becb-40f1-4151-aea3-5a9a9bd672c6",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fish"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Whale Token (Reef Worm)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
