import { defineCard } from "../define.js";

// EDHREC rank 6522.

const TEXT = "When this creature enters or dies, exile target permanent.";

export default defineCard({
  name: "Ashen Rider",
  manaCost: "{4}{W}{W}{B}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: ["permanent"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
