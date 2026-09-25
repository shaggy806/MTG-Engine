import { defineCard } from "../define.js";

export default defineCard({
  name: "Skystreak Engineer",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Pilot"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nExhaust — {4}{U}: Put two +1/+1 counters on this creature. (Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{4}{U}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "Exhaust — {4}{U}: Put two +1/+1 counters on this creature.",
      exhaust: true,
    },
  ],
});
