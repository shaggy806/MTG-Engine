import { defineCard } from "../define.js";

/**
 * Both printed 0 abilities. The −2 ("You may cast target instant or sorcery
 * card with mana value 3 or less from your graveyard") is dropped: there is no
 * target spec for an instant/sorcery in a graveyard *bounded by mana value*,
 * and no way to say "if that spell would be put into your graveyard, exile it
 * instead" for one specific cast.
 *
 * The second ability also drops "Sacrifice them at the beginning of the next
 * end step" — `create-token` has no delayed-sacrifice rider — so the tokens
 * stick around. That makes it stronger than the real card, not weaker, which
 * is the one direction a simplification normally shouldn't go; it is kept
 * because the alternative is a planeswalker with one near-dead ability.
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
    "[0]: Create two 1/1 red Elemental creature tokens. They gain haste.",
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
      effect: { kind: "create-token", token: "Elemental Token", count: 2 },
      resolve: null,
      text: "[0]: Create two 1/1 red Elemental creature tokens. They gain haste.",
    },
  ],
});
