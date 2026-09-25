import { defineCard } from "../define.js";

export default defineCard({
  name: "Thanos, Death's Consort",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Eternal", "Villain"],
  power: 3,
  toughness: 3,
  keywords: ["lifelink"],
  text: "Lifelink\nWhenever another creature dies, put a +1/+1 counter on Thanos.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another creature dies, put a +1/+1 counter on Thanos.",
    },
  ],
});
