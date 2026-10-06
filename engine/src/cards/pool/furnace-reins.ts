import { defineCard } from "../define.js";

const GRANTED_TEXT = "Whenever this creature deals combat damage to a player or battle, create a Treasure token.";
const TEXT = `Gain control of target creature until end of turn. Untap that creature. Until end of turn, it gains haste and "${GRANTED_TEXT}" (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")`;

// Threaten's steal plus Hideous Taskmaster's granted trigger. Battles aren't
// part of this engine, so only the player half can happen (Beamtown
// Beatstick). The Treasure goes to whoever controls the creature as it deals
// the damage.
export default defineCard({
  name: "Furnace Reins",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      { kind: "untap", target: 0 },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      {
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: { kind: "create-token", token: "Treasure Token", count: 1 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      },
    ],
  },
});
