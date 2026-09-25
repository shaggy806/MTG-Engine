import { defineCard } from "../define.js";

export default defineCard({
  name: "Dramatic Rescue",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Return target creature to its owner's hand. You gain 2 life.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});
