import { defineCard } from "../define.js";
import type { TriggeredAbility } from "../../abilities.js";

// Four instances of cascade, each triggering separately (rule 702.85c) and
// each looking for a card with mana value less than 10 — the spell that
// cast it, not what an earlier cascade found (the rulings).
const CASCADE: TriggeredAbility = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade.",
};

export default defineCard({
  name: "Apex Devastator",
  manaCost: "{8}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Chimera", "Hydra"],
  power: 10,
  toughness: 10,
  text:
    "Cascade, cascade, cascade, cascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order. Multiple instances of cascade each trigger separately.)",
  triggered: [CASCADE, CASCADE, CASCADE, CASCADE],
});
