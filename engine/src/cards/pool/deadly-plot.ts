import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadly Plot",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Destroy target creature or planeswalker.\n• Return target Zombie creature card from your graveyard to the battlefield tapped.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target creature or planeswalker.",
        targets: [
          {
            kind: "permanent",
            whose: "any",
            filter: { typesAnyOf: ["creature", "planeswalker"] },
          },
        ],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Return target Zombie creature card from your graveyard to the battlefield tapped.",
        targets: [
          {
            kind: "card-in-graveyard",
            whose: "you",
            filter: { subtype: "Zombie", type: "creature" },
          },
        ],
        effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      },
    ],
  },
});
