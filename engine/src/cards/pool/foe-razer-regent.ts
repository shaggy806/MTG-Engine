import { defineCard } from "../define.js";

// Draconic Destruction. "Whenever a creature you control fights" is a
// `fights` trigger (rule 701.14): each creature in the fight fights, so one
// of yours fighting another of yours triggers it twice, and one that doesn't
// fight (its target gone, 701.14b — the ruling) doesn't. "It" is the creature
// that fought, which the delayed trigger counts on at the beginning of the
// next end step (one fought during an end step waits for the next turn's —
// rule 603.7, its ruling). You choose whether to fight as the enters ability
// resolves (its ruling): a `may`.
const ENTER_TEXT = "When this creature enters, you may have it fight target creature you don't control.";
const FIGHT_TEXT =
  "Whenever a creature you control fights, put two +1/+1 counters on it at the beginning of the next end step.";

export default defineCard({
  name: "Foe-Razer Regent",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${FIGHT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "may",
        prompt: "Have Foe-Razer Regent fight the target creature?",
        effect: { kind: "fight", a: "source", b: 0 },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "fights", who: "you-control" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 2 },
        text: "Put two +1/+1 counters on that creature.",
      },
      resolve: null,
      text: FIGHT_TEXT,
    },
  ],
});
