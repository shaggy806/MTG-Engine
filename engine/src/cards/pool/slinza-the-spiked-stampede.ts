import { defineCard } from "../define.js";

// #388 in top-commanders.txt.
const COST_TEXT = "Beast spells you cast cost {2} less to cast.";
const COUNTER_TEXT = "Each other Beast creature you control enters with an additional +1/+1 counter on it.";
const FIGHT_TEXT =
  "Whenever Slinza or another creature with power 4 or greater enters, you may pay {1}{R/G}. When you " +
  "do, Slinza fights target creature you don't control.";

export default defineCard({
  name: "Slinza, the Spiked Stampede",
  manaCost: "{4}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 5,
  text: `${COST_TEXT}\n${COUNTER_TEXT}\n${FIGHT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Beast" }, caster: "you", reduceGeneric: 2 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", subtype: "Beast", controlledBy: "you" },
        counters: { kind: "+1/+1", amount: 1 },
      },
      text: COUNTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{R/G} to have Slinza fight a creature you don't control?",
        cost: "{1}{R/G}",
        effect: {
          kind: "reflexive-trigger",
          targets: ["creature-an-opponent-controls"],
          effect: { kind: "fight", a: "source", b: 0 },
          text: "When you do, Slinza fights target creature you don't control.",
        },
      },
      resolve: null,
      text: FIGHT_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        otherOnly: true,
        filter: { type: "creature", power: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{R/G} to have Slinza fight a creature you don't control?",
        cost: "{1}{R/G}",
        effect: {
          kind: "reflexive-trigger",
          targets: ["creature-an-opponent-controls"],
          effect: { kind: "fight", a: "source", b: 0 },
          text: "When you do, Slinza fights target creature you don't control.",
        },
      },
      resolve: null,
      text: FIGHT_TEXT,
    },
  ],
});
