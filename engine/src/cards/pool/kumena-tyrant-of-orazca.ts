import { defineCard } from "../define.js";

// EDHREC rank 5267.
//
// Rulings:
//   [2018-01-19] Activating Kumena's first ability after it has become blocked won't cause it to
//     become unblocked.
//   [2018-01-19] To activate Kumena's abilities, you may tap any untapped Merfolk you control,
//     including one you haven't controlled continuously since the beginning of your most recent
//     turn. (Note that tapping the creature doesn't use {T} [the tap symbol].) For Kumena's second
//     and third abilities, this includes Kumena itself.

export default defineCard({
  name: "Kumena, Tyrant of Orazca",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Shaman"],
  power: 2,
  toughness: 4,
  text: "Tap another untapped Merfolk you control: Kumena can't be blocked this turn.\nTap three untapped Merfolk you control: Draw a card.\nTap five untapped Merfolk you control: Put a +1/+1 counter on each Merfolk you control.",
  activated: [
    {
      // "Another": Kumena itself can't pay this one (no includeSelf).
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Merfolk", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "Tap another untapped Merfolk you control: Kumena can't be blocked this turn.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { subtype: "Merfolk", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Tap three untapped Merfolk you control: Draw a card.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 5, filter: { subtype: "Merfolk", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtype: "Merfolk", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Tap five untapped Merfolk you control: Put a +1/+1 counter on each Merfolk you control.",
    },
  ],
});
