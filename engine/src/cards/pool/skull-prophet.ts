import { defineCard } from "../define.js";

export default defineCard({
  name: "Skull Prophet",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 1,
  text: "{T}: Add {B} or {G}.\n{T}: Mill two cards. (Put the top two cards of your library into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {G}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 2 },
      resolve: null,
      text: "{T}: Mill two cards.",
    },
  ],
});
