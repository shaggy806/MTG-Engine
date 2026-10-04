import { defineCard } from "../define.js";

// EDHREC rank 5896.

const TEXT =
  "Landfall — Whenever a land you control enters, put a +1/+1 counter on this creature. If that land is a Forest, put two +1/+1 counters on this creature instead.";

export default defineCard({
  name: "Oran-Rief Hydra",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      // Akoum Hellkite's "if that land is a Mountain … instead" shape: the
      // land that fired the trigger, as it last existed if it has left.
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { subtype: "Forest" } },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
        else: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
