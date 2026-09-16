import { defineCard } from "../define.js";

export default defineCard({
  name: "Enter the God-Eternals",
  manaCost: "{2}{U}{U}{B}",
  colors: ["B", "U"],
  types: ["sorcery"],
  text:
    "Enter the God-Eternals deals 4 damage to target creature and you gain life equal to the damage dealt this way. Target player mills four cards. Amass Zombies 4.",
  targets: ["creature", "player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 4, target: 0 },
      // The printed card gains life equal to the damage *actually* dealt;
      // with no prevention in play that's always the full 4, and the engine
      // has no "amount actually dealt" amount to read back.
      { kind: "gain-life", amount: 4 },
      { kind: "mill", target: 1, amount: 4 },
      { kind: "amass", amount: 4, creatureType: "Zombie" },
    ],
  },
});
