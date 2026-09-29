import { defineCard } from "../define.js";

export default defineCard({
  name: "An Offer You Can't Refuse",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target noncreature spell. Its controller creates two Treasure tokens.",
  targets: ["noncreature-spell"],
  // The Treasures are made first, while the spell is still on the stack
  // under the player who controls it: once countered, a copy has ceased to
  // exist and a card cast by someone other than its owner is back under its
  // owner. A spell that can't be countered still pays its controller.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Treasure Token", count: 2, who: "target-controller" },
      { kind: "counter", target: 0 },
    ],
  },
});
