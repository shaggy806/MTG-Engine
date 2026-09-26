import { defineCard } from "../define.js";

const TRIGGER_TEXT = "Whenever another Bear you control enters, choose one —";
const COUNTERS_MODE = "Put two +1/+1 counters on target Bear.";
const FIGHT_MODE = "Target Bear you control fights target creature you don't control.";

// #386 in top-commanders.txt. Each mode brings its own targets as the
// ability goes on the stack (rule 603.3c).
export default defineCard({
  name: "Ayula, Queen Among Bears",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 2,
  toughness: 2,
  text: `${TRIGGER_TEXT}\n• ${COUNTERS_MODE}\n• ${FIGHT_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Bear" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: COUNTERS_MODE,
            targets: [{ kind: "permanent", filter: { subtype: "Bear" } }],
            effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
          },
          {
            text: FIGHT_MODE,
            targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Bear" } }, "creature-an-opponent-controls"],
            effect: { kind: "fight", a: 0, b: 1 },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${COUNTERS_MODE} ${FIGHT_MODE}`,
    },
  ],
});
