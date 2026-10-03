import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const DESTROY_TEXT = "For each opponent, destroy up to one target artifact or enchantment that player controls.";
const CYCLE_TEXT = "When you cycle this card, destroy all artifacts and enchantments.";

const ARTIFACT_OR_ENCHANTMENT = { typesAnyOf: ["artifact", "enchantment"] } as const;

// "For each opponent … that player controls": one optional slot per
// opponent, each bound to that player by seat (a game seats at most four, so
// three opponents) — a target that has come under anyone else's control is
// illegal as it resolves. They're destroyed together.
const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: ARTIFACT_OR_ENCHANTMENT },
});

export default defineCard({
  name: "Dismantling Wave",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  cycling: { cost: "{6}{W}{W}" },
  text: `${DESTROY_TEXT}\nCycling {6}{W}{W} ({6}{W}{W}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
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
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: [],
      effect: { kind: "destroy-all", filter: ARTIFACT_OR_ENCHANTMENT },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
