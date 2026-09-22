import { defineCard } from "../define.js";

// Top-commanders rank 159. "Whenever you attack" is an `attack-with` of at
// least one creature; "Zombies you control get +1/+1" is read as the draw
// trigger resolves, so a Zombie that arrives later that turn gets nothing.
export default defineCard({
  name: "Temmet, Naktamun's Will",
  manaCost: "{2}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "menace"],
  text:
    "Vigilance, menace\n" +
    "Whenever you attack, draw a card, then discard a card.\n" +
    "Whenever you draw a card, Zombies you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever you attack, draw a card, then discard a card.",
    },
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { subtype: "Zombie", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you draw a card, Zombies you control get +1/+1 until end of turn.",
    },
  ],
});
