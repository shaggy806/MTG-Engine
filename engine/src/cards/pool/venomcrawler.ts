import { defineCard } from "../define.js";

export default defineCard({
  name: "Venomcrawler",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Demon"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink\nDevourer of Souls — Whenever another creature dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Devourer of Souls — Whenever another creature dies, put a +1/+1 counter on this creature.",
    },
  ],
});
