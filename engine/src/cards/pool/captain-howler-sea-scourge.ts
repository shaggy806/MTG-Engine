import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #207 in top-commanders.txt. Several cards discarded at once are one
// event: one trigger, +2/+0 for each. "That creature" is the target; its
// draw fires each time it deals combat damage to a player this turn.
const DISCARD_TEXT =
  "Whenever you discard one or more cards, target creature gets +2/+0 until end of turn for each card " +
  "discarded this way. Whenever that creature deals combat damage to a player this turn, you draw a card.";

export default defineCard({
  name: "Captain Howler, Sea Scourge",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Shark", "Pirate"],
  power: 5,
  toughness: 4,
  text: `Ward—{2}, Pay 2 life.\n${DISCARD_TEXT}`,
  triggered: [
    ward({ mana: "{2}", payLife: 2 }),
    {
      trigger: { on: "discards", who: "you" },
      targets: [{ kind: "permanent", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt",
            target: 0,
            power: { product: [{ triggerValue: true }, 2] },
            toughness: 0,
            duration: "end-of-turn",
          },
          {
            kind: "delayed-trigger",
            at: { dealsCombatDamage: 0 },
            effect: { kind: "draw", amount: 1 },
            text: "Whenever that creature deals combat damage to a player this turn, you draw a card.",
          },
        ],
      },
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
});
