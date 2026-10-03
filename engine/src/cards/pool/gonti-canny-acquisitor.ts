import { defineCard } from "../define.js";

// #222 in top-commanders.txt.
//
// "Spells you cast but don't own" are the ones whose owner is someone else —
// a card cast from an opponent's library or exile — judged against the caster,
// whoever controls the card. The exiled card is looked at and exiled face
// down, so only Gonti's controller sees it (rule 406.3), and the permission
// and the any-type spending ride on the card, outlasting Gonti (its rulings);
// the spending is only for a spell cast under that permission (rule 118.14).
const TRIGGER_TEXT =
  "Whenever one or more creatures you control deal combat damage to a player, look at the top card of that player's library, then exile it face down. You may play that card for as long as it remains exiled, and mana of any type can be spent to cast that spell.";

export default defineCard({
  name: "Gonti, Canny Acquisitor",
  manaCost: "{2}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Aetherborn", "Rogue"],
  power: 5,
  toughness: 5,
  text: `Spells you cast but don't own cost {1} less to cast.\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { ownedBy: "opponent" }, caster: "you", reduceGeneric: 1 },
      text: "Spells you cast but don't own cost {1} less to cast.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        // "That player's library" — the player dealt the damage.
        whose: "trigger-player",
        duration: "while-exiled",
        faceDown: true,
        spendAs: "any-type",
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
