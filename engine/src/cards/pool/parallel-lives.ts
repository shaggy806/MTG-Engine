import { defineCard } from "../define.js";

// Oracle now reads "tokens", not "creature tokens" (the 2023 wording), so it
// is word for word Anointed Procession: every token, of any type, created
// under your control.
export default defineCard({
  name: "Parallel Lives",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "If an effect would create one or more tokens under your control, it creates twice that many of those tokens instead.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text:
        "If an effect would create one or more tokens under your control, it creates twice that many of those tokens instead.",
    },
  ],
});
