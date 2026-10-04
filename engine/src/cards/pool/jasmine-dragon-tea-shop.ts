import { defineCard } from "../define.js";

// EDHREC rank 4348.

const ALLY_MANA_TEXT =
  "{T}: Add one mana of any color. Spend this mana only to cast an Ally spell or activate an ability of an Ally source.";

export default defineCard({
  name: "Jasmine Dragon Tea Shop",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${ALLY_MANA_TEXT}\n{5}, {T}: Create a 1/1 white Ally creature token.`,
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
          spell: { subtype: "Ally" },
          // "an Ally source": a card's ability in any zone (rule 109.2a), as
          // Secluded Courtyard's "creature source".
          abilityOf: { subtype: "Ally" },
          abilityOfAnyZone: true,
          text: "Spend this mana only to cast an Ally spell or activate an ability of an Ally source.",
        },
      },
      resolve: null,
      text: ALLY_MANA_TEXT,
    },
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Ally Token", count: 1 },
      resolve: null,
      text: "{5}, {T}: Create a 1/1 white Ally creature token.",
    },
  ],
});
