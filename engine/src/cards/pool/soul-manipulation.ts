import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul Manipulation",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["instant"],
  text: "Choose one or both —\n• Counter target creature spell.\n• Return target creature card from your graveyard to your hand.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Counter target creature spell.",
        targets: ["creature-spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Return target creature card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
    ],
  },
});
