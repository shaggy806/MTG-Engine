import { defineCard } from "../define.js";

export default defineCard({
  name: "Body Dropper",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Devil", "Warrior"],
  power: 2,
  toughness: 2,
  text: "Whenever you sacrifice another creature, put a +1/+1 counter on this creature.\n{B}{R}, Sacrifice another creature: This creature gains menace until end of turn. (It can't be blocked except by two or more creatures.)",
  activated: [
    {
      cost: { mana: "{B}{R}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "menace", duration: "end-of-turn" },
      resolve: null,
      text: "{B}{R}, Sacrifice another creature: This creature gains menace until end of turn.",
      otherOnly: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice another creature, put a +1/+1 counter on this creature.",
    },
  ],
});
