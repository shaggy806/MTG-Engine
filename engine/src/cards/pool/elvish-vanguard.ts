import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Vanguard",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Whenever another Elf enters, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { subtype: "Elf" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another Elf enters, put a +1/+1 counter on this creature.",
    },
  ],
});
