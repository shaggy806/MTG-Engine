import { defineCard } from "../define.js";

// EDHREC rank 6053.

export default defineCard({
  name: "Endless One",
  manaCost: "{X}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 0,
  toughness: 0,
  text: "This creature enters with X +1/+1 counters on it.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
});
