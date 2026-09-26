import { defineCard } from "../define.js";

// #470 in top-commanders.txt.
//
// A modal triggered ability: its modes are chosen as it goes on the stack
// (rule 603.3c), up to X, where X is the number of times a mode was chosen
// for the spell that was cast, read as it triggered. With none chosen it's
// removed from the stack.
const TEXT =
  "Whenever you cast a modal spell, choose up to X, where X is the number of times you chose a mode for that " +
  "spell —";
const IMPULSE = "Exile the top card of your library. Until the end of your next turn, you may play it.";
const GROW = "Put a +1/+1 counter on Riku. It gains trample until end of turn.";
const BIRD = "Create a 1/1 blue Bird creature token with flying.";

export default defineCard({
  name: "Riku of Many Paths",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  text: `${TEXT}\n• ${IMPULSE}\n• ${GROW}\n• ${BIRD}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", modal: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 0,
        maxModes: { triggerValue: true },
        modes: [
          { text: IMPULSE, effect: { kind: "impulse-exile", amount: 1, duration: "your-next-turn" } },
          {
            text: GROW,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
                { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
              ],
            },
          },
          { text: BIRD, effect: { kind: "create-token", token: "1/1 Blue Bird Token", count: 1 } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
