import { defineCard } from "../define.js";

// "Double all damage Wolverine would deal" is a replacement (rule 614.1a) on
// damage from him alone (`fromSelf`). The counter's intervening-if (rule
// 603.4) reads whether he dealt damage to another creature this turn, both
// as the end step begins and as it resolves.
const DOUBLE_TEXT = "Unrivaled Lethality — Double all damage Wolverine would deal.";
const END_TEXT =
  "At the beginning of each end step, if Wolverine dealt damage to another creature this turn, put a +1/+1 counter on him.";
const REGEN_TEXT =
  "{1}{G}: Regenerate Wolverine. (The next time he would be destroyed this turn, instead tap him, remove him from combat, and heal all damage on him.)";

export default defineCard({
  name: "Wolverine, Best There Is",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Berserker", "Hero"],
  power: 2,
  toughness: 2,
  text: `${DOUBLE_TEXT}\n${END_TEXT}\n${REGEN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", multiplier: 2, fromSelf: true },
      text: DOUBLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "source", filter: { dealtDamageToCreatureThisTurn: true } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: END_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "regenerate", target: "source" },
      resolve: null,
      text: REGEN_TEXT,
    },
  ],
});
