import { defineCard } from "../define.js";

const ETB_TEXT = "When this creature enters, choose one —";
const DOUBLE_MODE = "Double the number of +1/+1 counters on this creature.";
const FIGHT_MODE = "This creature fights target creature you don't control.";

// Trample does nothing in a fight, and with the Hydra gone or its target
// illegal, nobody is dealt damage (the rulings).
export default defineCard({
  name: "Voracious Hydra",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 1,
  keywords: ["trample"],
  text: `Trample\nThis creature enters with X +1/+1 counters on it.\n${ETB_TEXT}\n• ${DOUBLE_MODE}\n• ${FIGHT_MODE}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: DOUBLE_MODE, effect: { kind: "double-counters", target: "source", counter: "+1/+1" } },
          {
            text: FIGHT_MODE,
            targets: ["creature-an-opponent-controls"],
            effect: { kind: "fight", a: "source", b: 0 },
          },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${DOUBLE_MODE} ${FIGHT_MODE}`,
    },
  ],
});
