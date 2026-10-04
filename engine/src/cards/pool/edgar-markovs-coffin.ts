import { defineCard } from "../define.js";

// Back face of Edgar, Charmed Groom. Treasure Map's shape: the three-counter
// check is the trigger's own, as it resolves; "those counters" are all the
// bloodline counters.
const TEXT =
  "At the beginning of your upkeep, create a 1/1 white and black Vampire creature token with lifelink and put a bloodline counter on Edgar Markov's Coffin. Then if there are three or more bloodline counters on it, remove those counters and transform it.";

export default defineCard({
  name: "Edgar Markov's Coffin",
  art: "https://cards.scryfall.io/art_crop/back/6/3/63ba8eef-b834-4031-b0a1-0f8505d53813.jpg",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "create-token",
            token: "Vampire Token (Edgar, Charmed Groom // Edgar Markov's Coffin)",
            count: 1,
          },
          { kind: "add-counter", target: "source", counter: "bloodline", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "bloodline", compare: { op: "gte", n: 3 } },
            then: {
              kind: "sequence",
              effects: [
                {
                  kind: "remove-counter",
                  target: "source",
                  counter: "bloodline",
                  amount: { countersOn: "source", counter: "bloodline" },
                },
                { kind: "transform", target: "source" },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Edgar, Charmed Groom", "Edgar Markov's Coffin"],
  transform: true,
});
