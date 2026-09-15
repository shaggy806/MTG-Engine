import { defineCard } from "../define.js";

export default defineCard({
  name: "Anguished Unmaking",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Exile target nonland permanent. You lose 3 life.",
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "lose-life", amount: 3, who: "you" },
    ],
  },
});
