import { defineCard } from "../define.js";

// EDHREC rank 4085.
//
// Earthbend is the `earthbend` effect (Earthbender Ascension, Aang): the
// target land you control becomes a 0/0 haste land creature, gets the
// counters, and returns tapped when it dies or is exiled (the rulings).

const ENTER_TEXT = "When this creature enters, earthbend 2.";
const TRAMPLE_TEXT = "Creatures you control with +1/+1 counters on them have trample.";

export default defineCard({
  name: "Badgermole",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Badger", "Mole"],
  power: 4,
  toughness: 4,
  text: "When this creature enters, earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)\nCreatures you control with +1/+1 counters on them have trample.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 2 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      // Sphere Grid's shape.
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
});
