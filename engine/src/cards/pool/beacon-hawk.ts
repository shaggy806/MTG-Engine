import { defineCard } from "../define.js";

export default defineCard({
  name: "Beacon Hawk",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature deals combat damage to a player, you may untap target creature.\n{W}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{W}: This creature gets +0/+1 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: ["creature"],
      effect: { kind: "may", prompt: "Untap target creature?", effect: { kind: "untap", target: 0 } },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, you may untap target creature.",
    },
  ],
});
