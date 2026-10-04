import { defineCard } from "../define.js";

// EDHREC rank 3754.
//
// Rulings:
//   [2004-10-04] This mana may be used on additional costs to cast the spell, such as Kicker.
//   [2004-10-04] You can spend the mana on costs on the spell's text.
//   [2004-10-04] This mana may not be used to pay costs imposed after the spell is initially cast.
//   [2004-10-04] The mana can't be used to pay Echo costs.
//
// `spendOnly.spell` with no `abilityOf`: it pays only while casting a
// matching spell — its whole total cost, additional costs included — and
// nothing after (ward, echo, an ability).

const TEXT = "{T}: Add {C}{C}{C}. Spend this mana only to cast artifact spells.";

export default defineCard({
  name: "Mishra's Workshop",
  colors: [],
  types: ["land"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 3,
        spendOnly: { spell: { type: "artifact" }, text: "Spend this mana only to cast artifact spells." },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
