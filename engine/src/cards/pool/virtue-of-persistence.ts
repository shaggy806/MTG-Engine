import { defineCard } from "../define.js";

const TEXT = "At the beginning of your upkeep, put target creature card from a graveyard onto the battlefield under your control.";

// An adventurer card (rule 715): Locthwain Scorn is the Adventure half.
export default defineCard({
  name: "Virtue of Persistence",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Virtue of Persistence", "Locthwain Scorn"],
  adventure: true,
});
