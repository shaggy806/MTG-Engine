import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const TEXT = "For any number of opponents, destroy target nonland permanent that player controls.";

// One optional slot per opponent, each bound to that player by seat (a game
// seats at most four): at most one target per opponent, and one that has
// come under anyone else's control since is illegal as it resolves. They're
// destroyed together.
const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: { notTypes: ["land"] } },
});

export default defineCard({
  name: "Windgrace's Judgment",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: TEXT,
  targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "destroy", target: 1 },
      { kind: "destroy", target: 2 },
    ],
  },
});
