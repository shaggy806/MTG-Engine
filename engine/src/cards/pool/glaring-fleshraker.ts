import { defineCard } from "../define.js";

const CAST_TEXT =
  'Whenever you cast a colorless spell, create a 0/1 colorless Eldrazi Spawn creature token with "Sacrifice this token: Add {C}."';
const ENTER_TEXT = "Whenever another colorless creature you control enters, this creature deals 1 damage to each opponent.";

// The Spawn comes first: the trigger resolves above the spell, even if that
// spell is then countered (the ruling).
export default defineCard({
  name: "Glaring Fleshraker",
  manaCost: "{2}{C}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Drone"],
  power: 2,
  toughness: 2,
  text: `${CAST_TEXT}\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { colorless: true } },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", colorless: true },
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
