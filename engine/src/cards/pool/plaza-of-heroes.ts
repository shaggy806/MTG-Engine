import { defineCard } from "../define.js";

const LEGENDARY_SPELL_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast a legendary spell.";
const AMONG_TEXT = "{T}: Add one mana of any color among legendary permanents you control.";
const PROTECT_TEXT =
  "{3}, {T}, Exile this land: Target legendary creature gains hexproof and indestructible until end of turn.";

export default defineCard({
  name: "Plaza of Heroes",
  types: ["land"],
  text: `{T}: Add {C}.\n${LEGENDARY_SPELL_TEXT}\n${AMONG_TEXT}\n${PROTECT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: { spell: { supertype: "legendary" }, text: "Spend this mana only to cast a legendary spell." },
      },
      resolve: null,
      text: LEGENDARY_SPELL_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { colorAmong: { supertype: "legendary", controlledBy: "you" } },
        amount: 1,
      },
      resolve: null,
      text: AMONG_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true, exileSelf: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PROTECT_TEXT,
    },
  ],
});
