import { defineCard } from "../define.js";

const GRANT_TEXT =
  "{T}: Until end of turn, target creature you control with power 4 or greater gains trample and \"Whenever this creature deals combat damage to a player, draw a card.\"";
const DRAW_TEXT = "Whenever this creature deals combat damage to a player, draw a card.";

// Power is checked only as a target: lowering it below 4 afterwards doesn't
// take the abilities away (the ruling).
export default defineCard({
  name: "Herd Heirloom",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["artifact"],
  text: `{T}: Add one mana of any color. Spend this mana only to cast a creature spell.\n${GRANT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: { spell: { type: "creature" }, text: "Spend this mana only to cast a creature spell." },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a creature spell.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", power: { op: "gte", n: 4 } } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          {
            kind: "grant-triggered",
            target: 0,
            duration: "end-of-turn",
            ability: {
              trigger: { on: "deals-combat-damage-to-player", who: "self" },
              targets: [],
              effect: { kind: "draw", amount: 1 },
              resolve: null,
              text: DRAW_TEXT,
            },
          },
        ],
      },
      resolve: null,
      text: GRANT_TEXT,
    },
  ],
});
