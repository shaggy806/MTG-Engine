import { defineCard } from "../define.js";

// EDHREC rank 3195.
// Makes Dragon Spirit → "Dragon Spirit Token".
//
// Rulings:
//   [2022-02-18] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.
//   [2022-02-18] An Aura controlled by an opponent does not cause a creature you control to be
//     modified.
//   [2022-02-18] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.
//
// The `modified` filter is rule 700.9 exactly as the rulings read it. An
// activated ability's condition counts its own source (rule 602.5), so an
// attacking modified Goro-Goro satisfies it.
const DRAGON_TEXT =
  "{3}{R}{R}: Create a 5/5 red Dragon Spirit creature token with flying. Activate only if you control an attacking modified creature. (Equipment, Auras you control, and counters are modifications.)";

export default defineCard({
  name: "Goro-Goro, Disciple of Ryusei",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Samurai"],
  power: 2,
  toughness: 2,
  text: `{R}: Creatures you control gain haste until end of turn.\n${DRAGON_TEXT}`,
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "haste",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{R}: Creatures you control gain haste until end of turn.",
    },
    {
      cost: { mana: "{3}{R}{R}", tap: false },
      condition: {
        kind: "controls",
        filter: { type: "creature", attacking: true, modified: true },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Spirit Token", count: 1 },
      resolve: null,
      text: DRAGON_TEXT,
    },
  ],
});
