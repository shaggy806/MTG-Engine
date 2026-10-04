import { defineCard } from "../define.js";

// EDHREC rank 3058.
//
// The experience counters are the player's, kept if Toph leaves, and every
// experience counter counts however it was got (the rulings). X is read as the
// earthbend resolves. A land that's already a creature may be targeted: it
// gets the counters and haste and becomes 0/0 again (the ruling — `earthbend`).
const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, you get an experience counter.";
const ATTACK_TEXT =
  "Whenever you attack, earthbend X, where X is the number of experience counters you have. (Target land you control becomes a 0/0 creature with haste that's still a land. Put X +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)";

export default defineCard({
  name: "Toph, Earthbending Master",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 2,
  toughness: 4,
  text: `${LANDFALL_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: { playerCounters: "experience" } },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
