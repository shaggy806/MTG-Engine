import { defineCard } from "../define.js";

export default defineCard({
  name: "Decoy Ploy",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one or both —\n• Return target Villain card from your graveyard to your hand.\n• Return target Hero card from your graveyard to your hand.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Return target Villain card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Villain" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      {
        text: "Return target Hero card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Hero" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
    ],
  },
});
