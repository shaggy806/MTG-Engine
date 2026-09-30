import { defineCard } from "../define.js";

const GRANTED_TEXT =
  "Whenever an artifact or creature you control is put into a graveyard from the battlefield, each opponent loses 1 life.";
const TEXT = `Commander creatures you own have "${GRANTED_TEXT}"`;

// Raised by Giants' Background shape. "You" in the granted ability is the
// commander's controller.
export default defineCard({
  name: "Agent of the Iron Throne",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, ownedBy: "you" } },
      grantsTriggered: [
        {
          trigger: { on: "dies", who: "you-control", filter: { typesAnyOf: ["artifact", "creature"] } },
          targets: [],
          effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
