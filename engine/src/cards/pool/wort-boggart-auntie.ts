import { defineCard } from "../define.js";

export default defineCard({
  name: "Wort, Boggart Auntie",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 3,
  toughness: 3,
  keywords: ["fear"],
  text: "Fear (This creature can't be blocked except by artifact creatures and/or black creatures.)\nAt the beginning of your upkeep, you may return target Goblin card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Goblin" } }],
      effect: {
        kind: "may",
        prompt: "Return target Goblin card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may return target Goblin card from your graveyard to your hand.",
    },
  ],
});
