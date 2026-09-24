import { defineCard } from "../define.js";

// X is read as it last existed on the battlefield — the counters it died
// with, since the move to the graveyard clears them.
export default defineCard({
  name: "Chasm Skulker",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Squid", "Horror"],
  power: 1,
  toughness: 1,
  text:
    "Whenever you draw a card, put a +1/+1 counter on this creature.\n" +
    "When this creature dies, create X 1/1 blue Squid creature tokens with islandwalk, where X is the number of +1/+1 counters on this creature. (They can't be blocked as long as defending player controls an Island.)",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you draw a card, put a +1/+1 counter on this creature.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Squid Token",
        count: { countersOn: "source", counter: "+1/+1" },
      },
      resolve: null,
      text:
        "When this creature dies, create X 1/1 blue Squid creature tokens with islandwalk, where X is the number of +1/+1 counters on this creature.",
    },
  ],
});
