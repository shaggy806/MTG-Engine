import { defineCard } from "../define.js";

const GRANTED_TEXT =
  "Whenever you cast a spell from exile, this creature deals damage equal to that spell's mana value to target opponent.";
const TEXT = `Commander creatures you own have "${GRANTED_TEXT}"`;

// Raised by Giants' Background shape. The spell is the trigger object, its
// mana value read off the stack ({X} counted).
export default defineCard({
  name: "Passionate Archaeologist",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, ownedBy: "you" } },
      grantsTriggered: [
        {
          trigger: { on: "cast-spell", who: "you", from: "exile" },
          targets: ["opponent"],
          effect: { kind: "damage", amount: { manaValueOf: "trigger-object" }, target: 0 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
