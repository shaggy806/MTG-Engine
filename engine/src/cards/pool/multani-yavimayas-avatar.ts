import { defineCard } from "../define.js";

// The bonus is a static ability, so it works only on the battlefield; in
// every other zone Multani is a 0/0 creature card (the ruling). Its last
// ability works from the graveyard and doesn't move the card as a cost
// (`staysInZone`); the lands returned for it are ones you control on the
// battlefield, never land cards in a graveyard (the ruling).
const PT_TEXT = "Multani gets +1/+1 for each land you control and each land card in your graveyard.";
const RETURN_TEXT =
  "{1}{G}, Return two lands you control to their owner's hand: Return this card from your graveyard to your hand.";

export default defineCard({
  name: "Multani, Yavimaya's Avatar",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Avatar"],
  power: 0,
  toughness: 0,
  keywords: ["reach", "trample"],
  text: `Reach, trample\n${PT_TEXT}\n${RETURN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "land", controlledBy: "you" }, pt: [1, 1] },
      text: PT_TEXT,
    },
    {
      affects: { scope: "self" },
      grantPtPerCount: { inGraveyard: { type: "land", ownedBy: "you" }, pt: [1, 1] },
      text: PT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, returnToHand: { count: 2, filter: { type: "land" } } },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
