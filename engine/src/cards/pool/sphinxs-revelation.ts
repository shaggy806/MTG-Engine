import { defineCard } from "../define.js";

export default defineCard({
  name: "Sphinx's Revelation",
  manaCost: "{X}{W}{U}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "You gain X life and draw X cards.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-life", amount: "x" },
      { kind: "draw", amount: "x" },
    ],
  },
});
