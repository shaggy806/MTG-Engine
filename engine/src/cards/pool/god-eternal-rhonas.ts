import { defineCard } from "../define.js";

// - "Double the power" is +X/+0, X each creature's own power as the ability
//   resolves (its ruling) — `double-pt-all`'s `powerOnly`. Only the creatures
//   you control then are doubled and gain vigilance (its ruling): the two
//   halves read the same board one after the other, with nothing between.
// - "Dies or is put into exile from the battlefield" is God-Eternal Oketra's
//   leaves trigger: the card is found where it went and only there (rule
//   400.7), falls to the bottom of a library of two or fewer, and whoever
//   controlled the God chooses (its rulings).
const ENTER_TEXT =
  "When God-Eternal Rhonas enters, double the power of each other creature you control until end of turn. " +
  "Those creatures gain vigilance until end of turn.";
const LEAVE_TEXT =
  "When God-Eternal Rhonas dies or is put into exile from the battlefield, you may put it into its " +
  "owner's library third from the top.";

export default defineCard({
  name: "God-Eternal Rhonas",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "God"],
  power: 5,
  toughness: 5,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${ENTER_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "double-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            duration: "end-of-turn",
            powerOnly: true,
            exceptSource: true,
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "vigilance",
            duration: "end-of-turn",
            exceptSource: true,
          },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard", "exile"] },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put God-Eternal Rhonas into its owner's library third from the top?",
        effect: { kind: "put-on-library", target: "trigger-object", position: { fromTop: 3 } },
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
