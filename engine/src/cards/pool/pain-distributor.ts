import { defineCard } from "../define.js";

// EDHREC rank 5117.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2023-04-14] Pain Distributor’s second ability triggers whenever a player casts their first
//     spell each turn, not just on their own turn.
//   [2023-04-14] Pain Distributor’s ability resolves before the spell that caused it to trigger,
//     but not before you have to pay for the original spell. You won’t be able to use the Treasure
//     token you create to pay for it.
//   [2023-04-14] Pain Distributor has to be on the battlefield at the moment they cast their first
//     spell. Notably, Pain Distributor’s first ability won’t trigger for you on the turn you cast
//     it, although it may trigger if another player casts their first spell that turn after Pain
//     Distributor is on the battlefield. If a spell causes Pain Distributor to leave the
//     battlefield as an additional cost to cast it, the ability won’t trigger.

// "They" is the player who cast the spell (`"trigger-controller"`, Genesis
// Chamber's create-token shape); "that player" is the controller of the
// artifact that went to the graveyard (Massacre Wurm's shape).
const TREASURE_TEXT = "Whenever a player casts their first spell each turn, they create a Treasure token.";
const DAMAGE_TEXT =
  "Whenever an artifact an opponent controls is put into a graveyard from the battlefield, this creature deals 1 damage to that player.";

export default defineCard({
  name: "Pain Distributor",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil", "Citizen"],
  power: 2,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${TREASURE_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", firstEachTurn: true },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, who: "trigger-controller" },
      resolve: null,
      text: TREASURE_TEXT,
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "artifact", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
