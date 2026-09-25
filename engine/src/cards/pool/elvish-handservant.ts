import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Handservant",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Whenever a player casts a Giant spell, you may put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", filter: { subtype: "Giant" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a +1/+1 counter on ~?",
        effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "Whenever a player casts a Giant spell, you may put a +1/+1 counter on this creature.",
    },
  ],
});
