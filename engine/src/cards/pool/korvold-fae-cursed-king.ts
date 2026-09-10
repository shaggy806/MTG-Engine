import { defineCard } from "../define.js";

// needed-cards P6 — completes the former stub. Uses the new `on: "sacrifice"`
// TriggerSpec and the `sacrifice` effect's `exceptSource` ("another permanent").
export default defineCard({
  name: "Korvold, Fae-Cursed King",
  manaCost: "{2}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Noble"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Korvold, Fae-Cursed King enters or attacks, sacrifice another permanent.\n" +
    "Whenever you sacrifice a permanent, put a +1/+1 counter on Korvold, Fae-Cursed King and draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "you", filter: {}, count: 1, exceptSource: true },
      resolve: null,
      text: "Whenever Korvold, Fae-Cursed King enters, sacrifice another permanent.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "you", filter: {}, count: 1, exceptSource: true },
      resolve: null,
      text: "Whenever Korvold, Fae-Cursed King attacks, sacrifice another permanent.",
    },
    {
      trigger: { on: "sacrifice", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever you sacrifice a permanent, put a +1/+1 counter on Korvold, Fae-Cursed King and draw a card.",
    },
  ],
});
