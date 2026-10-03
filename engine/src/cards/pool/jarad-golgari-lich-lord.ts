import { defineCard } from "../define.js";

const PUMP_TEXT = "Jarad gets +1/+1 for each creature card in your graveyard.";
const DRAIN_TEXT =
  "{1}{B}{G}, Sacrifice another creature: Each opponent loses life equal to the sacrificed creature's power.";
const RETURN_TEXT = "Sacrifice a Swamp and a Forest: Return this card from your graveyard to your hand.";

// "The sacrificed creature's power" is as it last existed on the battlefield
// (the ruling). "A Swamp and a Forest" is two lands, one of each type — a land
// that is both pays only one half (the ruling) — chosen as the cost is paid
// (`each`). The return is a graveyard ability that doesn't move the card as a
// cost (`staysInZone`).
export default defineCard({
  name: "Jarad, Golgari Lich Lord",
  manaCost: "{B}{B}{G}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Elf"],
  power: 2,
  toughness: 2,
  text: `${PUMP_TEXT}\n${DRAIN_TEXT}\n${RETURN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { inGraveyard: { type: "creature", ownedBy: "you" }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}{G}", tap: false, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: { kind: "lose-life", amount: { powerOf: "sacrificed" }, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
    {
      cost: { mana: null, tap: false, sacrifice: { each: [{ subtype: "Swamp" }, { subtype: "Forest" }] } },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
