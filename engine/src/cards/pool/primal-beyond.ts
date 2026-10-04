import { defineCard } from "../define.js";

// EDHREC rank 6139.
//
// Rulings:
//   [2008-04-01] The mana can't be spent to activate activated abilities of Elemental sources that
//     aren't on the battlefield (such as the reinforce ability of an Elemental card in your hand).
//   [2008-04-01] You can use the mana produced by Primal Beyond's last ability to pay an
//     alternative cost (such as evoke) or additional cost incurred while casting an Elemental
//     spell. It's not limited to just that spell's mana cost.
//
// The reveal is the reveal lands' replacement (Temple of the Dragon Queen);
// the spend restriction is Eldrazi Temple's (`abilityOf` a permanent, per the
// ruling).

const REVEAL_TEXT =
  "As this land enters, you may reveal an Elemental card from your hand. If you don't, this land enters tapped.";
const ANY_TEXT =
  "{T}: Add one mana of any color. Spend this mana only to cast an Elemental spell or activate an ability of an Elemental.";
const ELEMENTAL = { subtype: "Elemental" } as const;

export default defineCard({
  name: "Primal Beyond",
  colors: [],
  types: ["land"],
  text: `${REVEAL_TEXT}\n{T}: Add {C}.\n${ANY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tappedUnlessRevealFromHand: ["Elemental"] },
      text: REVEAL_TEXT,
    },
  ],
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
        spendOnly: {
          spell: ELEMENTAL,
          abilityOf: ELEMENTAL,
          text: "Spend this mana only to cast an Elemental spell or activate an ability of an Elemental.",
        },
      },
      resolve: null,
      text: ANY_TEXT,
    },
  ],
});
