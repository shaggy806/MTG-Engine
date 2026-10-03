import { defineCard } from "../define.js";

const DOUBLE_TEXT =
  "At the beginning of each combat, double the power and toughness of each creature you control until end of turn.";
const COUNTER_TEXT =
  "{G/P}{G/P}, Sacrifice two other creatures: Put an indestructible counter on Zopandrel. ({G/P} can be paid with either {G} or 2 life.)";

// `double-pt-all` reads each creature's own power and toughness as it
// resolves and adds that much again — a negative power doubled goes further
// below 0 (the rulings), and two Zopandrels double twice. `who: "any"` fires
// it at every combat, not only its controller's. The two other creatures are
// chosen as the cost is paid; `otherOnly` keeps Zopandrel out of it.
export default defineCard({
  name: "Zopandrel, Hunger Dominus",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 4,
  toughness: 6,
  keywords: ["reach"],
  text: `Reach\n${DOUBLE_TEXT}\n${COUNTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "any" },
      targets: [],
      effect: {
        kind: "double-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        duration: "end-of-turn",
      },
      resolve: null,
      text: DOUBLE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{G/P}{G/P}", tap: false, sacrifice: { filter: { type: "creature" }, count: 2 } },
      otherOnly: true,
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "indestructible", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
