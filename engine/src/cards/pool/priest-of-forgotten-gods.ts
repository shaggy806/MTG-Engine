import { defineCard } from "../define.js";

const PRIEST_TEXT =
  "{T}, Sacrifice two other creatures: Any number of target players each lose 2 life and sacrifice a creature of their choice. You add {B}{B} and draw a card.";

// The two other creatures are chosen as the cost is paid — a sacrifice of
// several, `otherOnly` keeping the Priest out of it. It may target no players
// at all and still add {B}{B} and draw (the ruling); having targets, it's no
// mana ability and uses the stack. A targeted player with no creature still
// loses the 2 life (the ruling). The targets' sacrifices are one edict:
// each chooses in turn, and they go together (rule 101.4).
export default defineCard({
  name: "Priest of Forgotten Gods",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 2,
  text: `${PRIEST_TEXT} (Activate only as an instant.)`,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "creature" }, count: 2 } },
      otherOnly: true,
      targets: [{ kind: "any-number", of: "player" }],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "for-each-target",
            from: 0,
            effect: { kind: "lose-life", amount: 2, target: 0 },
            simultaneous: true,
          },
          {
            kind: "for-each-target",
            from: 0,
            effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
          },
          { kind: "add-mana", mana: "B", amount: 2 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: PRIEST_TEXT,
    },
  ],
});
