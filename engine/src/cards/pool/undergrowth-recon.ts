import { defineCard } from "../define.js";

export default defineCard({
  name: "Undergrowth Recon",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, return target land card from your graveyard to the battlefield tapped.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      resolve: null,
      text: "At the beginning of your upkeep, return target land card from your graveyard to the battlefield tapped.",
    },
  ],
});
