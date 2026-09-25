import { defineCard } from "../define.js";

export default defineCard({
  name: "Terror of Mount Velus",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "double-strike"],
  text: "Flying\nDouble strike (This creature deals both first-strike and regular combat damage.)\nWhen this creature enters, creatures you control gain double strike until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "When this creature enters, creatures you control gain double strike until end of turn.",
    },
  ],
});
