import { defineCard } from "../define.js";

// "One or more" modes, each with its own target. Countering an ability on the
// stack removes it (rule 701.6b) — a mana ability never gets there.
export default defineCard({
  name: "Sublime Epiphany",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Choose one or more —\n" +
    "• Counter target spell.\n" +
    "• Counter target activated or triggered ability.\n" +
    "• Return target nonland permanent to its owner's hand.\n" +
    "• Create a token that's a copy of target creature you control.\n" +
    "• Target player draws a card.",
  castModal: {
    minModes: 1,
    maxModes: 5,
    modes: [
      { text: "Counter target spell.", targets: ["spell"], effect: { kind: "counter", target: 0 } },
      {
        text: "Counter target activated or triggered ability.",
        targets: ["activated-or-triggered-ability"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "Return target nonland permanent to its owner's hand.",
        targets: ["nonland-permanent"],
        effect: { kind: "return-to-hand", target: 0 },
      },
      {
        text: "Create a token that's a copy of target creature you control.",
        targets: ["creature-you-control"],
        effect: { kind: "create-token-copy", of: 0, count: 1 },
      },
      {
        text: "Target player draws a card.",
        targets: ["player"],
        effect: { kind: "draw", amount: 1, target: 0 },
      },
    ],
  },
});
