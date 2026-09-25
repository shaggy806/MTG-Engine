import { defineCard } from "../define.js";

// #316 in top-commanders.txt.
//
// The mana ability's delayed trigger rides on its first `add-mana` step
// (`also`) — one mana ability, off the stack. "With lesser mana value" is
// lesser than the spell that fired it (its trigger object), bound as the
// reveal applies.
const PROHIBIT_TEXT = "You can't cast permanent spells.";
const MANA_TEXT =
  "{4}, {T}: Add {W}{U}{B}{R}{G}. When you next cast a spell this turn, exile cards from the top of " +
  "your library until you exile an instant or sorcery card with lesser mana value. Until end of turn, " +
  "you may cast that card without paying its mana cost. Put each other card exiled this way on the " +
  "bottom of your library in a random order.";

export default defineCard({
  name: "Codie, Vociferous Codex",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Book", "Construct"],
  power: 1,
  toughness: 4,
  text: `${PROHIBIT_TEXT}\n${MANA_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      prohibits: {
        who: "you",
        spells: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
      },
      text: PROHIBIT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-mana",
            mana: "W",
            amount: 1,
            also: {
              kind: "delayed-trigger",
              at: { nextSpell: {} },
              effect: {
                kind: "reveal-until",
                exile: true,
                filter: {
                  typesAnyOf: ["instant", "sorcery"],
                  manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } },
                },
                then: { kind: "allow-cast-from-exile", target: 0, free: true },
                rest: "bottom-random",
                keepFound: true,
              },
              text:
                "Exile cards from the top of your library until you exile an instant or sorcery card with " +
                "lesser mana value. Until end of turn, you may cast that card without paying its mana " +
                "cost. Put each other card exiled this way on the bottom of your library in a random order.",
            },
          },
          { kind: "add-mana", mana: "U", amount: 1 },
          { kind: "add-mana", mana: "B", amount: 1 },
          { kind: "add-mana", mana: "R", amount: 1 },
          { kind: "add-mana", mana: "G", amount: 1 },
        ],
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
