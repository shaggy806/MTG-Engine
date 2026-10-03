import { defineCard } from "../define.js";

const GUNGNIR = "I — Gungnir — Destroy target creature an opponent controls.";
const GRANTED = "Whenever this creature deals combat damage to a player, that player loses the game.";
const ZANTETSUKEN = `II — Zantetsuken — This creature gains "${GRANTED}"`;
const HALL = "III — Hall of Sorrow — Draw two cards. Each player loses 2 life.";

// Chapter II's grant lasts as long as Odin stays on the battlefield; once the
// granted ability has triggered, its player loses as it resolves whatever has
// become of Odin (the ruling). A player who can't lose the game doesn't.
export default defineCard({
  name: "Summon: Primal Odin",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Knight"],
  power: 5,
  toughness: 3,
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n" +
    `${GUNGNIR}\n${ZANTETSUKEN}\n${HALL}`,
  chapters: [
    {
      at: [1],
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: GUNGNIR,
    },
    {
      at: [2],
      targets: [],
      effect: {
        kind: "grant-triggered",
        target: "source",
        duration: "permanent",
        ability: {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: { kind: "lose-game", who: "trigger-player" },
          resolve: null,
          text: GRANTED,
        },
      },
      resolve: null,
      text: ZANTETSUKEN,
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 2 },
          { kind: "lose-life", amount: 2, who: "each-player" },
        ],
      },
      resolve: null,
      text: HALL,
    },
  ],
});
