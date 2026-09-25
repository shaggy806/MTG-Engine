import { defineCard } from "../define.js";

export default defineCard({
  name: "Live or Die",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Return target creature card from your graveyard to the battlefield.\n• Destroy target creature.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Return target creature card from your graveyard to the battlefield.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      {
        text: "Destroy target creature.",
        targets: ["creature"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
