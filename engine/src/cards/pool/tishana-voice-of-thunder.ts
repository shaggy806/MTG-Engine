import { defineCard } from "../define.js";

// EDHREC rank 5557.
//
// Rulings:
//   [2017-09-29] If Tishana enters the battlefield while you have no cards in hand, it will be put
//     into your graveyard for having 0 toughness before its triggered ability resolves.
//   [2017-09-29] Because damage remains marked on a creature until it's removed as the turn ends,
//     the damage Tishana takes during combat may become lethal if cards leave your hand later in
//     the turn, such as by casting them in your postcombat main phase.
//   [2017-09-29] The number of creatures you control is counted only as Tishana's last ability
//     resolves. If Tishana is still on the battlefield, it'll count itself.
// Body of Knowledge's CDA; the draw count is read as the ability resolves.
const CDA_TEXT = "Tishana's power and toughness are each equal to the number of cards in your hand.";
const ETB_TEXT = "When Tishana enters, draw a card for each creature you control.";

export default defineCard({
  name: "Tishana, Voice of Thunder",
  manaCost: "{5}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Shaman"],
  power: 0,
  toughness: 0,
  text: `${CDA_TEXT}\nYou have no maximum hand size.\n${ETB_TEXT}`,
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
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { countOf: { type: "creature", controlledBy: "you" } } },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
