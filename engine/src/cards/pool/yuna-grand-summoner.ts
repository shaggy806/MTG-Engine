import { defineCard } from "../define.js";

// #215 in top-commanders.txt.
//
// - Grand Summon is a mana ability (rule 605.1a): the delayed trigger is set
//   up as part of it (`add-mana`'s `also`), off the stack, whether it's
//   tapped by hand or by the auto-payer — including while paying for the
//   creature spell it then applies to.
// - The last ability counts every counter the permanent had, not just
//   +1/+1 counters (the 2025-06-06 ruling), read as it last existed.
const SUMMON_TEXT =
  "Grand Summon — {T}: Add one mana of any color. When you next cast a creature spell this turn, " +
  "that creature enters with two additional +1/+1 counters on it.";
const COUNTERS_TEXT =
  "Whenever another permanent you control is put into a graveyard from the battlefield, if it had " +
  "one or more counters on it, you may put that number of +1/+1 counters on target creature.";

export default defineCard({
  name: "Yuna, Grand Summoner",
  manaCost: "{1}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 5,
  text: `${SUMMON_TEXT}\n${COUNTERS_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        also: {
          kind: "delayed-trigger",
          at: { nextSpell: { type: "creature" } },
          effect: { kind: "enters-with-counters", target: "trigger-object", counter: "+1/+1", amount: 2 },
          text: "That creature enters with two additional +1/+1 counters on it.",
        },
      },
      resolve: null,
      text: SUMMON_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        otherOnly: true,
        filter: { counters: { compare: { op: "gte", n: 1 } } },
      },
      targets: ["creature"],
      effect: {
        kind: "may",
        prompt: "Put that many +1/+1 counters on the target creature?",
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { countersOn: "trigger-object" } },
      },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
