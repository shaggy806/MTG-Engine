import { defineCard } from "../define.js";

// #478 in top-commanders.txt.
//
// "Goad all suspected creatures" is every one on the battlefield, whoever
// controls it — your own suspected creatures too, which matters only in an
// additional combat this turn, since the goad lapses as your next turn begins.
//
// Only an attacking creature deals combat damage to a player, and every
// attacker is the active player's, so the creatures that set off the draw
// trigger have one controller between them: the trigger object's (read as it
// last existed if it has since left). "You and the controller of those
// creatures each draw a card" is one card each — should that player be you by
// then (you gained control of the creature in response), you draw once.
const ATTACK_TEXT = "Whenever Nelly Borca attacks, suspect target creature. Then goad all suspected creatures.";
const DRAW_TEXT =
  "Whenever one or more creatures an opponent controls deal combat damage to one or more of your opponents, " +
  "you and the controller of those creatures each draw a card.";

export default defineCard({
  name: "Nelly Borca, Impulsive Accuser",
  manaCost: "{2}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Detective"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${ATTACK_TEXT} (A suspected creature has menace and can't block.)\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "suspect", target: 0 },
          { kind: "goad", filter: { type: "creature", suspected: true } },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: {
        on: "deals-damage-batch",
        who: "any",
        filter: { type: "creature", controlledBy: "opponent" },
        to: "opponent",
        combat: true,
        once: "per-event",
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { controlledBy: "opponent" } },
            then: { kind: "draw", amount: 1, who: "trigger-controller" },
          },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
