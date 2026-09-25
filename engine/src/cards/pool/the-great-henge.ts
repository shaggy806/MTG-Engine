import { defineCard } from "../define.js";

const REDUCTION_TEXT =
  "This spell costs {X} less to cast, where X is the greatest power among creatures you control.";
const MANA_TEXT = "{T}: Add {G}{G}. You gain 2 life.";
const ENTERS_TEXT =
  "Whenever a nontoken creature you control enters, put a +1/+1 counter on it and draw a card.";

export default defineCard({
  name: "The Great Henge",
  manaCost: "{7}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${REDUCTION_TEXT}\n${MANA_TEXT}\n${ENTERS_TEXT}`,
  selfCostReduction: {
    // Unconditional: the same always-true gate Blasphemous Act uses. Only the
    // generic part comes off, so {G}{G} is always paid (rule 601.2f).
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: {
      aggregate: "max",
      of: "power",
      filter: { type: "creature", controlledBy: "you" },
    },
  },
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // The life gain is part of the mana ability (rule 605.1a), so it rides
      // on `also` rather than being a second step that would put the ability
      // on the stack.
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: 2,
        also: { kind: "gain-life", amount: 2 },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", token: false },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
