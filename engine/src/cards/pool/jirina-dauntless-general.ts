import { defineCard } from "../define.js";

// EDHREC rank 6292.
// Bojuka Bog's `exile-graveyard`; `grant-keyword-all` hits what matches as it resolves
// (rule 611.2c), which is the ruling.
//
// Rulings:
//   [2023-05-12] The set of creatures affected by Jirina's last ability is determined as the
//     ability resolves. Humans you begin to control later in the turn, non-Human creatures you
//     control that become Human, and noncreature permanents that become Human creatures later in
//     the turn won't gain hexproof and indestructible.

const ETB_TEXT = "When Jirina enters, exile target player's graveyard.";
const SAC_TEXT = "Sacrifice Jirina: Humans you control gain hexproof and indestructible until end of turn.";
const HUMANS = { type: "creature", subtype: "Human", controlledBy: "you" } as const;

export default defineCard({
  name: "Jirina, Dauntless General",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${ETB_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: HUMANS, keyword: "hexproof", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: HUMANS, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
