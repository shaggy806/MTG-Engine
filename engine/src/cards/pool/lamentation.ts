import { defineCard } from "../define.js";

// EDHREC rank 5912.
//
// Rulings:
//   [2025-11-17] If the target creature is an illegal target as Lamentation's first ability tries
//     to resolve, it won't resolve and none of its effects will happen. You won't gain life.
//   [2025-11-17] Each token must attack the appropriate player if able.
//   [2025-11-17] Opponents who have left the game aren't counted when determining how many tokens
//     to create.

const ENTER_TEXT = "When this creature enters, destroy target creature an opponent controls. You gain 3 life.";
const ENCORE_TEXT =
  "Encore {6}{B}{B} ({6}{B}{B}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)";

export default defineCard({
  name: "Lamentation",
  manaCost: "{5}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elemental", "Incarnation"],
  power: 5,
  toughness: 4,
  text: `${ENTER_TEXT}\n${ENCORE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 3 }],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      // Angel of Indemnity's encore: `zone: "graveyard"` makes exiling this
      // card the implicit cost.
      cost: { mana: "{6}{B}{B}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: ENCORE_TEXT,
    },
  ],
});
