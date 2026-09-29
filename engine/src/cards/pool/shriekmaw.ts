import { defineCard } from "../define.js";

export default defineCard({
  name: "Shriekmaw",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 2,
  keywords: ["fear"],
  evoke: { cost: "{1}{B}" },
  text:
    "Fear (This creature can't be blocked except by artifact creatures and/or black creatures.)\n" +
    "When this creature enters, destroy target nonartifact, nonblack creature.\n" +
    "Evoke {1}{B} (You may cast this spell for its evoke cost. If you do, it's sacrificed when it enters.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", filter: { type: "creature", notTypes: ["artifact"], notColors: ["B"] } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target nonartifact, nonblack creature.",
    },
  ],
});
