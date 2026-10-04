import { defineCard } from "../define.js";

// EDHREC rank 5495.
//
// Rulings:
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing.

const EARTHBEND_TEXT =
  "When this creature enters, earthbend 2. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)";
const VIGILANCE_TEXT = "Land creatures you control have vigilance. (Attacking doesn't cause them to tap.)";

// Ba Sing Se's earthbend and Aang, Destined Savior's vigilance static.
export default defineCard({
  name: "Earthbending Student",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 1,
  toughness: 3,
  text: `${EARTHBEND_TEXT}\n${VIGILANCE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 2 },
      resolve: null,
      text: EARTHBEND_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { types: ["land", "creature"], controlledBy: "you" } },
      grantKeywords: ["vigilance"],
      text: VIGILANCE_TEXT,
    },
  ],
});
