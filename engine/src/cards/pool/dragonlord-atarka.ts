import { defineCard } from "../define.js";

const ENTERS_TEXT =
  "When Dragonlord Atarka enters, it deals 5 damage divided as you choose among any number of target creatures and/or planeswalkers your opponents control.";

// The number of targets and the split are chosen as the trigger goes on the
// stack, at least 1 each, so at most five (the rulings); a target gone
// illegal loses its share, and with every one illegal nothing happens.
export default defineCard({
  name: "Dragonlord Atarka",
  manaCost: "{5}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 8,
  toughness: 8,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${ENTERS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "any-number",
          of: { kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } },
          max: 5,
        },
      ],
      divided: { total: 5, slot: 0 },
      effect: { kind: "damage-divided", from: 0 },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
