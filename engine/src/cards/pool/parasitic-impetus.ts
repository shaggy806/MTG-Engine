import { defineCard } from "../define.js";

// EDHREC rank 2813.
//
// Rulings:
//   [2020-04-17] If you are the attacking creature's controller, you lose 2 life and gain 2 life.
//     You won't lose the game if your life total is 0 in between these two events.
//   [2020-04-17] Parasitic Impetus causes you to gain life, not the attacking creature's
//     controller.
//   [2023-06-30] If a creature you control has been goaded by multiple opponents, it must attack
//     one of your opponents that hasn't goaded it, as that fulfills the maximum number of goad
//     requirements. If a creature you control has been goaded by each of your opponents, the
//     creature must attack an opponent (rather than a planeswalker or battle), but you choose
//     which opponent it attacks.
//   [2023-06-30] If the creature doesn't meet any of the above exceptions and can attack, it must
//     attack a player other than the controller of the spell or ability that goaded it if able. If
//     the creature can't attack any of those players but could otherwise attack, it must attack a
//     planeswalker an opponent controls, a battle an opponent controls, or a player who goaded it.
//   [2023-06-30] Attacking with a goaded creature doesn't cause it to stop being goaded. If there
//     is an additional combat phase that turn, or if another player gains control of it before it
//     stops being goaded, it must attack again if able.
//   [2023-06-30] Being goaded isn't an ability the creature has. Once it's been goaded, it must
//     attack as detailed above even if it loses all abilities.
//   [2023-06-30] If, during a player's declare attackers step, a creature that player controls
//     that's been goaded is tapped, is affected by a spell or ability that says it can't attack,
//     or hasn't been under that player's control continuously since the turn began (and doesn't
//     have haste), then it doesn't attack. If there's a cost associated with having a creature
//     attack a player, its controller isn't forced to pay that cost, so it doesn't have to attack
//     that player.

const PUMP_TEXT = "Enchanted creature gets +2/+2 and is goaded.";
const ATTACK_TEXT = "Whenever enchanted creature attacks, its controller loses 2 life and you gain 2 life.";

export default defineCard({
  name: "Parasitic Impetus",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${PUMP_TEXT} (It attacks each combat if able and attacks a player other than you if able.)\n${ATTACK_TEXT}`,
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 2], goads: true, text: PUMP_TEXT }],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      // "Its controller": the attacking creature's (the trigger object's),
      // not the Aura's. One instruction, so a controller losing 2 then
      // gaining 2 never sits at 0 between (the ruling).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "trigger-controller" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
