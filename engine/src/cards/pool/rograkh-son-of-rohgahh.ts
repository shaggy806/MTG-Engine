import { defineCard } from "../define.js";

// Commander backlog #11 by deck count (top-commanders.txt). Almost entirely a
// keyword card, which is why it authors in one sitting despite being one of
// the most-played commanders in the format — it is popular for its cost, not
// its text.
//
// `colors: ["R"]` is not inferable from the mana cost here: {0} has no
// coloured pips, and Rograkh is red by colour indicator.
export default defineCard({
  name: "Rograkh, Son of Rohgahh",
  manaCost: "{0}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kobold", "Warrior"],
  power: 0,
  toughness: 1,
  keywords: ["first-strike", "menace", "trample"],
  text:
    "First strike, menace, trample\n" +
    "Partner (You can have two commanders if both have partner.)",
});
