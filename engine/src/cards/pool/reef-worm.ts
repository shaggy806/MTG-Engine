import { defineCard } from "../define.js";

// EDHREC rank 5449.
// Makes Fish → "Fish Token (Reef Worm)", which makes "Whale Token (Reef Worm)",
// which makes "Kraken Token (Spawning Kraken)" (a plain 9/9 blue Kraken).

const TEXT =
  "When this creature dies, create a 3/3 blue Fish creature token with \"When this token dies, create a 6/6 blue Whale creature token with 'When this token dies, create a 9/9 blue Kraken creature token.'\"";

export default defineCard({
  name: "Reef Worm",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Worm"],
  power: 0,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Fish Token (Reef Worm)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
