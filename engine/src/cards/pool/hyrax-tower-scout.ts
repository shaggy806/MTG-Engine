import { defineCard } from "../define.js";

export default defineCard({
  name: "Hyrax Tower Scout",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, untap target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "When this creature enters, untap target creature.",
    },
  ],
});
