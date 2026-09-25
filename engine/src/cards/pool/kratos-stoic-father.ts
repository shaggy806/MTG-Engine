import { defineCard } from "../define.js";

// #169 in top-commanders.txt.
//
// One printed ability with two trigger events: "whenever you attack with one
// or more Gods" (once per declaration) and "whenever a God dies" (any God,
// anyone's). Each is its own entry.
const EXPERIENCE_TEXT =
  "Whenever you attack with one or more Gods and whenever a God dies, you get an experience counter.";
const COUNTERS_TEXT =
  "At the beginning of your end step, put a number of +1/+1 counters on target creature equal to " +
  "the number of experience counters you have.";
const experience = { kind: "add-player-counters", counter: "experience", amount: 1 } as const;

export default defineCard({
  name: "Kratos, Stoic Father",
  manaCost: "{2}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God", "Warrior"],
  power: 4,
  toughness: 4,
  pairing: { kind: "partner-group", group: "Father & son" },
  text:
    `${EXPERIENCE_TEXT}\n${COUNTERS_TEXT}\n` +
    "Partner—Father & son (You can have two commanders if both have this ability.)",
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1, filter: { subtype: "God" } },
      targets: [],
      effect: experience,
      resolve: null,
      text: EXPERIENCE_TEXT,
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", subtype: "God" } },
      targets: [],
      effect: experience,
      resolve: null,
      text: EXPERIENCE_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { playerCounters: "experience" } },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
