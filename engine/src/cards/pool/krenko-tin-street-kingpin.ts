import { defineCard } from "../define.js";

const TEXT =
  "Whenever Krenko attacks, put a +1/+1 counter on it, then create a number of 1/1 red Goblin creature tokens equal to Krenko's power.";

// The Goblins aren't attacking (the ruling). If Krenko has left by the time
// this resolves, no counter goes on the new object and its power is read as
// it last existed on the battlefield (rule 608.2h).
export default defineCard({
  name: "Krenko, Tin Street Kingpin",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "create-token", token: "Goblin Token", count: { powerOf: "source" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
