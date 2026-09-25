import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// #35 in top-commanders.txt.
const FOOD_TEXT =
  "At the beginning of combat on your turn, create a Food token. " +
  '(It\'s an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")';
const COST_TEXT = "Activated abilities of Foods you control cost {1} less to activate.";

export default defineCard({
  name: "Sam, Loyal Attendant",
  manaCost: "{1}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Peasant"],
  power: 2,
  toughness: 4,
  pairing: { kind: "partner-with", name: "Frodo, Adventurous Hobbit" },
  text:
    "Partner with Frodo, Adventurous Hobbit (When this creature enters, target player may put " +
    "Frodo into their hand from their library, then shuffle.)\n" +
    `${FOOD_TEXT}\n${COST_TEXT}`,
  triggered: [
    partnerWithTrigger("Frodo, Adventurous Hobbit"),
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: FOOD_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      abilityCostModification: { applies: { subtype: "Food", controlledBy: "you" }, reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
