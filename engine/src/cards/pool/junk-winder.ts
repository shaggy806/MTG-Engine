import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// One trigger per token entering, a token stack once per token in it. "Its
// controller's next untap step" follows the permanent, not the player: one
// that changes hands first stays tapped through its new controller's next
// untap step instead (the rulings of the same text — Icy Blast).
const TAP_TEXT =
  "Whenever a token you control enters, tap target nonland permanent an opponent controls. It doesn't untap during its controller's next untap step.";

export default defineCard({
  name: "Junk Winder",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 5,
  toughness: 6,
  text: `Affinity for tokens (This spell costs {1} less to cast for each token you control.)\n${TAP_TEXT}`,
  selfCostReduction: affinity({ token: true }),
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true } },
      targets: [{ kind: "permanent", filter: { notTypes: ["land"], controlledBy: "opponent" } }],
      effect: { kind: "tap", target: 0, doesntUntapNext: true },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
