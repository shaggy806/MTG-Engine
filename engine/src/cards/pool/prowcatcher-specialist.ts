import { defineCard } from "../define.js";

export default defineCard({
  name: "Prowcatcher Specialist",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\nExhaust — {3}{R}: Put two +1/+1 counters on this creature. (Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "Exhaust — {3}{R}: Put two +1/+1 counters on this creature.",
      exhaust: true,
    },
  ],
});
