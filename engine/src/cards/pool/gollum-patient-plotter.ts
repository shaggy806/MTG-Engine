import { defineCard } from "../define.js";

// EDHREC rank 4441. The graveyard ability returns this card only while it's
// still in your graveyard.
const LEAVE = "When Gollum leaves the battlefield, the Ring tempts you.";
const RETURN = "{B}, Sacrifice a creature: Return this card from your graveyard to your hand. Activate only as a sorcery.";

export default defineCard({
  name: "Gollum, Patient Plotter",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Horror"],
  power: 3,
  toughness: 1,
  text: `${LEAVE}\n${RETURN}`,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "the-ring-tempts-you" },
      resolve: null,
      text: LEAVE,
    },
  ],
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: { filter: { type: "creature" } } },
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      zone: "graveyard",
      staysInZone: true,
      sorcerySpeed: true,
      text: RETURN,
    },
  ],
});
