import { defineCard } from "../define.js";

export default defineCard({
  name: "Thorn Lieutenant",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 3,
  text: "Whenever this creature becomes the target of a spell or ability an opponent controls, create a 1/1 green Elf Warrior creature token.\n{5}{G}: This creature gets +4/+4 until end of turn.",
  activated: [
    {
      cost: { mana: "{5}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 4, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "{5}{G}: This creature gets +4/+4 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: "Whenever this creature becomes the target of a spell or ability an opponent controls, create a 1/1 green Elf Warrior creature token.",
    },
  ],
});
