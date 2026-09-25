import { defineCard } from "../define.js";

// #220 in top-commanders.txt.
//
// "Dies or is put into the command zone" is a leaves-the-battlefield
// trigger limited to those two destinations; the +1/+1 counters it had are
// read as it last existed on the battlefield.
const ENTERS_TEXT = "Reyhan enters with three +1/+1 counters on it.";
const MOVE_TEXT =
  "Whenever a creature you control dies or is put into the command zone, if it had one or more " +
  "+1/+1 counters on it, you may put that many +1/+1 counters on target creature.";

export default defineCard({
  name: "Reyhan, Last of the Abzan",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 0,
  toughness: 0,
  pairing: { kind: "partner" },
  text: `${ENTERS_TEXT}\n${MOVE_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 3 } },
      text: ENTERS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "leaves-battlefield",
        who: "you-control",
        to: ["graveyard", "command"],
        filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      targets: ["creature"],
      effect: {
        kind: "may",
        prompt: "Put that many +1/+1 counters on the target creature?",
        effect: {
          kind: "add-counter",
          target: 0,
          counter: "+1/+1",
          amount: { countersOn: "trigger-object", counter: "+1/+1" },
        },
      },
      resolve: null,
      text: MOVE_TEXT,
    },
  ],
});
