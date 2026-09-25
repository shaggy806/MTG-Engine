import { defineCard } from "../define.js";

export default defineCard({
  name: "Custodian of the Trove",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 2,
  toughness: 5,
  keywords: ["defender"],
  text: "Defender\nThis creature enters tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
