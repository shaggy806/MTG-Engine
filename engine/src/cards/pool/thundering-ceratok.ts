import { defineCard } from "../define.js";

export default defineCard({
  name: "Thundering Ceratok",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Rhino"],
  power: 4,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, other creatures you control gain trample until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "trample",
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: "When this creature enters, other creatures you control gain trample until end of turn.",
    },
  ],
});
