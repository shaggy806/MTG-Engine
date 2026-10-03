import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, for each opponent, you may cast up to one target instant or sorcery card from that player's graveyard without paying its mana cost. If a spell cast this way would be put into a graveyard, exile it instead.";

// One optional slot per opponent, bound to that player by seat (up to one
// target per opponent — the rulings). The cards are cast one at a time as
// the ability resolves, in the order you choose, each a "may" of its own —
// so the last one cast resolves first; one that can't be cast stays where
// it is (the rulings). Timing restrictions from its type are ignored, X is
// 0, and a spell cast this way is exiled rather than put into a graveyard,
// countered or not (the rulings).
const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "card-in-graveyard", whose: { seat }, filter: { typesAnyOf: ["instant", "sorcery"] } },
});

export default defineCard({
  name: "Diluvian Primordial",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
      effect: { kind: "cast-now", from: "targets", repeat: true, free: true, exileAfter: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
