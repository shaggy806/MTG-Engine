import { defineCard } from "../define.js";

export default defineCard({
  name: "Darigaaz's Charm",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  types: ["instant"],
  text: "Choose one —\n• Return target creature card from your graveyard to your hand.\n• Darigaaz's Charm deals 3 damage to any target.\n• Target creature gets +3/+3 until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Return target creature card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      {
        text: "Darigaaz's Charm deals 3 damage to any target.",
        targets: ["any-target"],
        effect: { kind: "damage", amount: 3, target: 0 },
      },
      {
        text: "Target creature gets +3/+3 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      },
    ],
  },
});
