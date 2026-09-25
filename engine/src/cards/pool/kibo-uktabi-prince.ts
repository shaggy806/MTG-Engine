import { defineCard } from "../define.js";

// #144 in top-commanders.txt.
//
// The Banana's mana ability gains its life as the mana is made (`also`), off
// the stack, however it's activated.
const BANANA_TEXT =
  '{T}: Each player creates a colorless artifact token named Banana with "{T}, Sacrifice this ' +
  'token: Add {R} or {G}. You gain 2 life."';
const COUNTERS_TEXT =
  "Whenever an artifact an opponent controls is put into a graveyard from the battlefield, put a " +
  "+1/+1 counter on each creature you control that's an Ape or a Monkey.";
const ATTACK_TEXT = "Whenever Kibo attacks, defending player sacrifices an artifact of their choice.";

export default defineCard({
  name: "Kibo, Uktabi Prince",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Monkey", "Noble"],
  power: 2,
  toughness: 2,
  text: `${BANANA_TEXT}\n${COUNTERS_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Banana Token", count: 1, who: "each-player" },
      resolve: null,
      text: BANANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "artifact", controlledBy: "opponent" } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you", subtypes: ["Ape", "Monkey"] },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: COUNTERS_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "trigger-player", filter: { type: "artifact" }, count: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
