import { defineCard } from "../define.js";

export default defineCard({
  name: "Tidus, Blitzball Star",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 1,
  text: "Whenever an artifact you control enters, put a +1/+1 counter on Tidus.\nWhenever Tidus attacks, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, put a +1/+1 counter on Tidus.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Whenever Tidus attacks, tap target creature an opponent controls.",
    },
  ],
});
