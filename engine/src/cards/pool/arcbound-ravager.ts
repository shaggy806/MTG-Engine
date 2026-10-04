import { defineCard } from "../define.js";

// EDHREC rank 3694.
//
// Rulings:
//   [2006-09-25] If this creature gets enough -1/-1 counters put on it to cause its toughness to
//     be 0 or less (or the damage marked on it to be lethal), modular will put a number of +1/+1
//     counters on the target artifact creature equal to the number of +1/+1 counters on this
//     creature before it left the battlefield.
//
// Modular N (rule 702.43a) is two abilities: "This permanent enters with N
// +1/+1 counters on it" (a self enters-battlefield replacement) and "When
// this permanent is put into a graveyard from the battlefield, you may put a
// +1/+1 counter on target artifact creature for each +1/+1 counter on this
// permanent", the counters it died with (last-known information, Aerith
// Gainsborough's countersOn source).
const SAC_TEXT = "Sacrifice an artifact: Put a +1/+1 counter on this creature.";
const MODULAR_TEXT =
  "Modular 1 (This creature enters with a +1/+1 counter on it. When it dies, you may put its +1/+1 counters on target artifact creature.)";

export default defineCard({
  name: "Arcbound Ravager",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Beast"],
  power: 0,
  toughness: 0,
  text: `${SAC_TEXT}\n${MODULAR_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 1 } },
      text: MODULAR_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "permanent", filter: { types: ["artifact", "creature"] } }],
      effect: {
        kind: "may",
        prompt: "Put this creature's +1/+1 counters on target artifact creature?",
        effect: {
          kind: "add-counter",
          target: 0,
          counter: "+1/+1",
          amount: { countersOn: "source", counter: "+1/+1" },
        },
      },
      resolve: null,
      text: MODULAR_TEXT,
    },
  ],
});
