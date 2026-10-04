import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 6166.
//
// Rulings:
//   [2021-11-19] If Archghoul of Thraben and another Zombie you control die at the same time, this
//     ability will trigger once for each of them.
//
// "This creature or another Zombie" is two triggers: itself (whatever its
// types), and `otherOnly` Zombies. The look is Sarinth Steelseeker's: a
// Zombie card may be revealed and taken (min 0); the card not taken may then
// go to the graveyard (`secondPick`), or stay on top.
const TEXT =
  "Whenever this creature or another Zombie you control dies, look at the top card of your library. If it's a Zombie card, you may reveal it and put it into your hand. If you don't put the card into your hand, you may put it into your graveyard.";

const look: EffectSpec = {
  kind: "look-and-choose",
  zone: "library",
  count: 1,
  reveal: "chosen",
  min: 0,
  max: 1,
  filter: { subtype: "Zombie" },
  destination: "hand",
  secondPick: { min: 0, max: 1, destination: "graveyard" },
  leftover: "stay",
};

export default defineCard({
  name: "Archghoul of Thraben",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Cleric"],
  power: 3,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: look,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Zombie" }, otherOnly: true },
      targets: [],
      effect: look,
      resolve: null,
      text: TEXT,
    },
  ],
});
