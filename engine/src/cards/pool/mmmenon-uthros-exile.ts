import { defineCard } from "../define.js";

export default defineCard({
  name: "Mm'menon, Uthros Exile",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Jellyfish", "Advisor"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever an artifact you control enters, put a +1/+1 counter on target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, put a +1/+1 counter on target creature.",
    },
  ],
});
