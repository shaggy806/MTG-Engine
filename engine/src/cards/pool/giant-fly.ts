import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Fly",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever you sacrifice another permanent, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", otherOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you sacrifice another permanent, this creature gets +1/+0 until end of turn.",
    },
  ],
});
