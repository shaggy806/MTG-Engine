import { defineCard } from "../define.js";

// #45 in top-commanders.txt. A spell of several colours triggers each
// matching ability, in the order its controller puts them on the stack (its
// ruling). "Scry 2" lets the player order the cards kept on top, and those
// put on the bottom (rule 701.22a).
const WHITE_TEXT = "Whenever you cast a white spell, create a 1/1 white Human Soldier creature token.";
const BLUE_TEXT = "Whenever you cast a blue spell, scry 2.";
const RED_TEXT = "Whenever you cast a red spell, Aragorn deals 3 damage to target opponent.";
const GREEN_TEXT = "Whenever you cast a green spell, target creature gets +4/+4 until end of turn.";

export default defineCard({
  name: "Aragorn, the Uniter",
  manaCost: "{R}{G}{W}{U}",
  colors: ["W", "U", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 5,
  toughness: 5,
  text: `${WHITE_TEXT}\n${BLUE_TEXT}\n${RED_TEXT}\n${GREEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["W"] } },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: WHITE_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["U"] } },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: BLUE_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["R"] } },
      targets: ["opponent"],
      effect: { kind: "damage", target: 0, amount: 3 },
      resolve: null,
      text: RED_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["G"] } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 4, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: GREEN_TEXT,
    },
  ],
});
