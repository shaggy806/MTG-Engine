import { defineCard } from "../define.js";

export default defineCard({
  name: "Zookeeper Mechan",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 1,
  toughness: 3,
  text: "{T}: Add {R}.\n{6}{R}: Target creature you control gets +4/+0 until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{6}{R}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "modify-pt", target: 0, power: 4, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{6}{R}: Target creature you control gets +4/+0 until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
