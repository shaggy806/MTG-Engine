import { defineCard } from "../define.js";

// A Background: a "Choose a Background" commander's second commander, which
// the deck validator reads off the type line. "Commander creatures you own"
// reaches your commanders wherever they are on the battlefield, including
// under an opponent's control.
export default defineCard({
  name: "Raised by Giants",
  manaCost: "{5}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: "Commander creatures you own have base power and toughness 10/10 and are Giants in addition to their other types.",
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", isCommander: true, ownedBy: "you" },
      },
      addSubtypes: ["Giant"],
      setBasePt: { power: 10, toughness: 10 },
      text: "Commander creatures you own have base power and toughness 10/10 and are Giants in addition to their other types.",
    },
  ],
});
