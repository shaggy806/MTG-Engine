import { defineCard } from "../define.js";

// #20 in top-commanders.txt.
//
// - The artifacts become lands in layer 4 and gain no mana ability, as the
//   reminder text says — so an artifact land is a legal earthbend target.
// - Earthbend 2 is the `earthbend` effect (a land-you-control target).
const STATIC_TEXT =
  "Nontoken artifacts you control are lands in addition to their other types. " +
  "(They don't gain the ability to {T} for mana.)";
const EARTHBEND_TEXT =
  "At the beginning of your end step, earthbend 2. (Target land you control becomes a 0/0 " +
  "creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is " +
  "exiled, return it to the battlefield tapped.)";

export default defineCard({
  name: "Toph, the First Metalbender",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 3,
  text: `${STATIC_TEXT}\n${EARTHBEND_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you", token: false } },
      addTypes: ["land"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 2 },
      resolve: null,
      text: EARTHBEND_TEXT,
    },
  ],
});
