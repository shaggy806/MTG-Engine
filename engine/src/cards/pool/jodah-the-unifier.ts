import { defineCard } from "../define.js";

const PUMP_TEXT =
  "Legendary creatures you control get +X/+X, where X is the number of legendary creatures you control.";
const CAST_TEXT =
  "Whenever you cast a legendary spell from your hand, exile cards from the top of your library until you exile " +
  "a legendary nonland card with lesser mana value. You may cast that card without paying its mana cost. Put the " +
  "rest on the bottom of your library in a random order.";

// The triggering spell's mana value counts the X chosen for it, read off it
// on the stack (or as it last was there). The card found, judged by its
// front face, may be cast whole and free — either face of a modal DFC, even
// a nonlegendary back — or stays in exile; it isn't put on the bottom. With
// nothing found the whole library is exiled and becomes the library again in
// a random order (the rulings).
export default defineCard({
  name: "Jodah, the Unifier",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 5,
  toughness: 5,
  text: `${PUMP_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      grantPtPerCount: { filter: { type: "creature", supertype: "legendary", controlledBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", from: "hand", filter: { supertype: "legendary" } },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: {
          supertype: "legendary",
          notTypes: ["land"],
          manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } },
        },
        exile: true,
        rest: "bottom-random",
        keepFound: true,
        then: { kind: "cast-now", target: 0, free: true },
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
