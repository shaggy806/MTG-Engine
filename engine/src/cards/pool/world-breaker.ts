import { defineCard } from "../define.js";

const CAST_TEXT = "When you cast this spell, exile target artifact, enchantment, or land.";
const RETURN_TEXT =
  "{2}{C}, Sacrifice a land: Return this card from your graveyard to your hand. ({C} represents colorless mana.)";

// Devoid: colorless despite its green mana cost. The cast trigger resolves
// before the spell, even if the spell is countered. The return is a
// graveyard ability that doesn't move the card as a cost (`staysInZone`),
// so it works only while World Breaker is in the graveyard (the ruling).
export default defineCard({
  name: "World Breaker",
  manaCost: "{6}{G}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 5,
  toughness: 7,
  keywords: ["reach"],
  text: `Devoid (This card has no color.)\n${CAST_TEXT}\nReach\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "enchantment", "land"] } }],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{C}", tap: false, sacrifice: { filter: { type: "land" } } },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
