import { defineCard } from "../define.js";

// With its only target gone the spell doesn't resolve, and there's no extra
// combat (its ruling); the combat itself needs a main phase to follow.
export default defineCard({
  name: "Seize the Day",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{2}{R}" },
  text:
    "Untap target creature. After this main phase, there is an additional combat phase followed by an additional main phase.\n" +
    "Flashback {2}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "untap", target: 0 }, { kind: "additional-combat" }],
  },
});
