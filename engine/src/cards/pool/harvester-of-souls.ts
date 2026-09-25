import { defineCard } from "../define.js";

export default defineCard({
  name: "Harvester of Souls",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 5,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\nWhenever another nontoken creature dies, you may draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { token: false, type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever another nontoken creature dies, you may draw a card.",
    },
  ],
});
