import { defineCard } from "../define.js";

// #389 in top-commanders.txt.
const XP_TEXT = "Whenever a creature you control with power 2 or less enters, you get an experience counter.";
const COMBAT_TEXT =
  "At the beginning of combat on your turn, put X +1/+1 counters on another target creature you " +
  "control, where X is the number of experience counters you have.";

export default defineCard({
  name: "Ezuri, Claw of Progress",
  manaCost: "{2}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Elf", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${XP_TEXT}\n${COMBAT_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", power: { op: "lte", n: 2 } },
      },
      targets: [],
      effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
      resolve: null,
      text: XP_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { playerCounters: "experience" } },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
