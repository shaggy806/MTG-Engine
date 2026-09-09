import { defineCard } from "../define.js";

export default defineCard({
  name: "An Offer You Can't Refuse",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target noncreature spell. Its controller creates two Treasure tokens.",
  targets: ["noncreature-spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 2, who: "target-controller" },
    ],
  },
});
