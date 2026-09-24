import { defineCard } from "../define.js";

// Top-commanders rank 443. The permission rides on the chosen card (see
// Silas Renn, Seeker Adept), so it survives Emry leaving.
export default defineCard({
  name: "Emry, Lurker of the Loch",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 2,
  text:
    "This spell costs {1} less to cast for each artifact you control.\n" +
    "When Emry enters, mill four cards.\n" +
    "{T}: Choose target artifact card in your graveyard. You may cast that card this turn.",
  selfCostReduction: {
    // Unconditional: the same always-true gate Blasphemous Act uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "artifact", controlledBy: "you" } },
  },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 4 },
      resolve: null,
      text: "When Emry enters, mill four cards.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "grant-graveyard-cast", target: 0 },
      resolve: null,
      text: "{T}: Choose target artifact card in your graveyard. You may cast that card this turn.",
    },
  ],
});
