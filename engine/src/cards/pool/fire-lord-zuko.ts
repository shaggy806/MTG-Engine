import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// #172 in top-commanders.txt.
//
// "A permanent you control enters from exile" reads how it came onto the
// battlefield (`enteredFrom`); a spell comes from the stack, so a creature
// cast from exile fires only the cast half.
const FIREBENDING_TEXT =
  "Firebending X, where X is Fire Lord Zuko's power. (Whenever this creature attacks, add X {R}. " +
  "This mana lasts until end of combat.)";
const COUNTERS_TEXT =
  "Whenever you cast a spell from exile and whenever a permanent you control enters from exile, " +
  "put a +1/+1 counter on each creature you control.";
const counters = {
  kind: "add-counter-all",
  filter: { type: "creature", controlledBy: "you" },
  counter: "+1/+1",
  amount: 1,
} as const;

export default defineCard({
  name: "Fire Lord Zuko",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Ally"],
  power: 2,
  toughness: 4,
  text: `${FIREBENDING_TEXT}\n${COUNTERS_TEXT}`,
  triggered: [
    firebending({ powerOf: "source" }, FIREBENDING_TEXT),
    {
      trigger: { on: "cast-spell", who: "you", from: "exile" },
      targets: [],
      effect: counters,
      resolve: null,
      text: COUNTERS_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { enteredFrom: "exile" } },
      targets: [],
      effect: counters,
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
