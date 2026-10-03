import { defineCard } from "../define.js";

export default defineCard({
  name: "Shivan Devastator",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["flying", "haste"],
  text: "Flying, haste\nThis creature enters with X +1/+1 counters on it.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
});
