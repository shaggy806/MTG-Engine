import { defineCard } from "../define.js";

// Only tokens that would be created as creatures (rule 614.1a): a token an
// effect makes a creature as it enters isn't one (the ruling). The Angel
// replaces what the token would have been entirely — no ability or copy
// exception it would have had — but tapped, attacking, "that token gains
// haste", counters put on it and its later sacrifice or exile still happen
// (the ruling).
const TEXT =
  "If one or more creature tokens would be created under your control, that many 4/4 white Angel creature tokens with flying and vigilance are created instead.";

export default defineCard({
  name: "Divine Visitation",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", creatureTokensInstead: "4/4 Vigilant Angel Token" },
      text: TEXT,
    },
  ],
});
