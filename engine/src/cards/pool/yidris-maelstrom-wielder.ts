import { defineCard } from "../define.js";

const TEXT =
  "Whenever Yidris deals combat damage to a player, as you cast spells from your hand this turn, they gain " +
  "cascade. (When you cast the spell, exile cards from the top of your library until you exile a nonland card " +
  "that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random " +
  "order.)";

// The grant is the player's for the rest of the turn, even if Yidris leaves;
// each time the ability resolves adds another cascade (the rulings).
const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;

export default defineCard({
  name: "Yidris, Maelstrom Wielder",
  manaCost: "{U}{B}{R}{G}",
  colors: ["U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ogre", "Wizard"],
  power: 5,
  toughness: 4,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "grant-spells-this-turn", castFrom: ["hand"], triggered: [CASCADE] },
      resolve: null,
      text: TEXT,
    },
  ],
});
