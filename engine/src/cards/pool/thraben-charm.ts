import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// EDHREC rank 3133.
//
// "Any number of target players": an any-number group can't sit in a mode, so it is Will of the
// Abzan's shape — up to one slot per player, each a different one. A game seats at most four
// players, so four slots cover every choice. The graveyards go together (`simultaneous`).
// The damage counts the creatures you control as the mode resolves.

const DAMAGE_MODE =
  "Thraben Charm deals damage equal to twice the number of creatures you control to target creature.";
const DESTROY_MODE = "Destroy target enchantment.";
const EXILE_MODE = "Exile any number of target players' graveyards.";

const players: TargetSpec[] = [
  { kind: "optional", of: "player" },
  { kind: "optional", of: { kind: "other", of: "player", than: { slot: 0 } } },
  { kind: "optional", of: { kind: "other", of: "player", than: { slots: [0, 1] } } },
  { kind: "optional", of: { kind: "other", of: "player", than: { slots: [0, 1, 2] } } },
];

export default defineCard({
  name: "Thraben Charm",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: `Choose one —\n• ${DAMAGE_MODE}\n• ${DESTROY_MODE}\n• ${EXILE_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: DAMAGE_MODE,
        targets: ["creature"],
        effect: {
          kind: "damage",
          amount: { countOf: { type: "creature", controlledBy: "you" }, times: 2 },
          target: 0,
        },
      },
      {
        text: DESTROY_MODE,
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: EXILE_MODE,
        targets: players,
        effect: {
          kind: "for-each-target",
          from: 0,
          effect: { kind: "exile-graveyard", target: 0 },
          simultaneous: true,
        },
      },
    ],
  },
});
