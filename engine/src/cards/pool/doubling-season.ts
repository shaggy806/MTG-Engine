import { defineCard } from "../define.js";

export default defineCard({
  name: "Doubling Season",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "If an effect would create one or more tokens under your control, it creates twice that many tokens instead.\n" +
    "If an effect would put one or more counters on a permanent you control, it puts twice that many of those counters on that permanent instead.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text: "If an effect would create one or more tokens under your control, it creates twice that many tokens instead.",
    },
    {
      affects: { scope: "self" },
      replacement: { event: "would-add-counter", multiplier: 2 },
      text: "If an effect would put one or more counters on a permanent you control, it puts twice that many of those counters on that permanent instead.",
    },
  ],
});
