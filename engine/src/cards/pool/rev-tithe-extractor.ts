import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever you attack, target creature gains deathtouch until end of turn.";
const DAMAGE_TEXT =
  "Whenever one or more creatures you control deal combat damage to a player, create a Treasure token, then look at the top card of that player's library and exile it face down. You may cast that card for as long as it remains exiled.";

// Once per player dealt combat damage. Exiled face down, only Rev's
// controller may look at the card (rule 406.3); a land can't be cast.
export default defineCard({
  name: "Rev, Tithe Extractor",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 3,
  text: `${ATTACK_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Treasure Token", count: 1 },
          {
            kind: "impulse-exile",
            amount: 1,
            whose: "trigger-player",
            duration: "while-exiled",
            castOnly: true,
            faceDown: true,
          },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
