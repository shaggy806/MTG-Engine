import { defineCard } from "../define.js";

// #287 in top-commanders.txt.
//
// "The number of times you descended this turn" is the permanent cards put
// into your graveyard this turn (`turnHistory: "descended"`).
const PT_TEXT =
  "The Mycotyrant's power and toughness are each equal to the number of creatures you control that " +
  "are Fungi and/or Saprolings.";
const TOKEN_TEXT =
  'At the beginning of your end step, create X 1/1 black Fungus creature tokens with "This token ' +
  "can't block,\" where X is the number of times you descended this turn. (You descend each time a " +
  "permanent card is put into your graveyard from anywhere.)";

export default defineCard({
  name: "The Mycotyrant",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Fungus"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: `Trample\n${PT_TEXT}\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "creature", controlledBy: "you", subtypes: ["Fungus", "Saproling"] } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Fungus Token (Can't Block)",
        count: { turnHistory: "descended" },
      },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
