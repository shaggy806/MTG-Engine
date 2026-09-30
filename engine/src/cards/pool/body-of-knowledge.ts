import { defineCard } from "../define.js";

const CDA_TEXT = "Body of Knowledge's power and toughness are each equal to the number of cards in your hand.";
const DAMAGE_TEXT = "Whenever this creature is dealt damage, draw that many cards.";

export default defineCard({
  name: "Body of Knowledge",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 0,
  toughness: 0,
  text: `${CDA_TEXT}\nYou have no maximum hand size.\n${DAMAGE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: "cards-in-your-hand", plusPower: 0, plusToughness: 0 },
      text: CDA_TEXT,
    },
    { affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." },
  ],
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
