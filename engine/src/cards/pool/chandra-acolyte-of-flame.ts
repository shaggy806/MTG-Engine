import { defineCard } from "../define.js";

/**
 * Both printed 0 abilities. The −2 ("You may cast target instant or sorcery
 * card with mana value 3 or less from your graveyard") is dropped: there is no
 * target spec for an instant/sorcery in a graveyard *bounded by mana value*,
 * and no way to say "if that spell would be put into your graveyard, exile it
 * instead" for one specific cast.
 */
export default defineCard({
  name: "Chandra, Acolyte of Flame",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Chandra"],
  loyalty: 4,
  text:
    "[0]: Put a loyalty counter on each red planeswalker you control.\n" +
    "[0]: Create two 1/1 red Elemental creature tokens. They gain haste. " +
    "Sacrifice them at the beginning of the next end step.",
  activated: [
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "planeswalker", colors: ["R"], controlledBy: "you" },
        counter: "loyalty",
        amount: 1,
      },
      resolve: null,
      text: "[0]: Put a loyalty counter on each red planeswalker you control.",
    },
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Elemental Token",
        count: 2,
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text:
        "[0]: Create two 1/1 red Elemental creature tokens. They gain haste. " +
        "Sacrifice them at the beginning of the next end step.",
    },
  ],
});
