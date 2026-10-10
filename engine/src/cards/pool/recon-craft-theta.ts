import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 5922. The Alien gets its counter after it's made (it isn't
// "enters with"), and survives the state-based check that follows it.
const ALIEN = "When this Vehicle enters, create a 0/0 blue Alien creature token. Put a +1/+1 counter on it.";
const PROLIFERATE =
  "Whenever this Vehicle attacks, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)";

export default defineCard({
  name: "Recon Craft Theta",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ALIEN}\n${PROLIFERATE}\nCrew 2`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Alien Token", count: 1, thenCounters: { kind: "+1/+1", amount: 1 } },
      resolve: null,
      text: ALIEN,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: PROLIFERATE,
    },
  ],
  activated: [crew(2)],
});
