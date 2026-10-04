import { defineCard } from "../define.js";

// EDHREC rank 3185.
//
// Rulings:
//   [2020-04-17] If the target creature is an illegal target when Surly Badgersaur's last ability
//     tries to resolve, the ability doesn't resolve. If it's a legal target but Surly Badgersaur
//     is no longer on the battlefield when the ability resolves, the target creature won't deal or
//     be dealt damage.
//   [2020-04-17] Surly Badgersaur's abilities are triggered abilities, not activated abilities.

const CREATURE_TEXT = "Whenever you discard a creature card, put a +1/+1 counter on this creature.";
const LAND_TEXT =
  "Whenever you discard a land card, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";
const OTHER_TEXT =
  "Whenever you discard a noncreature, nonland card, this creature fights up to one target creature you don't control.";

export default defineCard({
  name: "Surly Badgersaur",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Badger", "Dinosaur"],
  power: 3,
  toughness: 3,
  text: `${CREATURE_TEXT}\n${LAND_TEXT}\n${OTHER_TEXT}`,
  triggered: [
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: CREATURE_TEXT,
    },
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: LAND_TEXT,
    },
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { notTypes: ["creature", "land"] } },
      targets: [{ kind: "optional", of: "creature-an-opponent-controls" }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: OTHER_TEXT,
    },
  ],
});
