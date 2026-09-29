import { defineCard } from "../define.js";
import { unearth } from "../helpers.js";

const ENTER_TEXT = "Whenever another creature you control enters, this creature deals 1 damage to each opponent.";

export default defineCard({
  name: "Molten Gatekeeper",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 2,
  toughness: 3,
  text:
    `${ENTER_TEXT}\n` +
    "Unearth {R} ({R}: Return this card from your graveyard to the battlefield. It gains haste. Exile it at the beginning of the next end step or if it would leave the battlefield. Unearth only as a sorcery.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [unearth("{R}")],
});
