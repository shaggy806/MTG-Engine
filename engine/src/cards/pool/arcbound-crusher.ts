import { defineCard } from "../define.js";

// EDHREC rank 6032.
//
// Rulings:
//   [2006-09-25] If this creature gets enough -1/-1 counters put on it to cause its toughness to
//     be 0 or less (or the damage marked on it to be lethal), modular will put a number of +1/+1
//     counters on the target artifact creature equal to the number of +1/+1 counters on this
//     creature before it left the battlefield.

// Modular 1 (rule 702.43a) — Arcbound Ravager's shape: a self enters
// replacement plus a dies trigger reading the counters it died with.
const MODULAR_TEXT =
  "Modular 1 (This creature enters with a +1/+1 counter on it. When it dies, you may put its +1/+1 counters on target artifact creature.)";

export default defineCard({
  name: "Arcbound Crusher",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Juggernaut"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: `Trample\nWhenever another artifact enters, put a +1/+1 counter on this creature.\n${MODULAR_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "artifact" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another artifact enters, put a +1/+1 counter on this creature.",
    },
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
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 1 } },
      text: MODULAR_TEXT,
    },
  ],
});
