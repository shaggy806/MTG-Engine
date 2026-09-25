import { defineCard } from "../define.js";

export default defineCard({
  name: "Corrupt Court Official",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, target opponent discards a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "When this creature enters, target opponent discards a card.",
    },
  ],
});
