import { defineCard } from "../define.js";

export default defineCard({
  name: "Gale Swooper",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, target creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gains flying until end of turn.",
    },
  ],
});
