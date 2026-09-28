import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever one or more Goblins you control attack, create a 1/1 red Goblin creature token that's tapped and attacking.";
const ENTER_TEXT = "Whenever another creature you control enters, General Kreat deals 1 damage to each opponent.";

export default defineCard({
  name: "General Kreat, the Boltbringer",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${ATTACK_TEXT}\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1, filter: { subtype: "Goblin" } },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 1, tapped: true, attacking: "choose" },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
