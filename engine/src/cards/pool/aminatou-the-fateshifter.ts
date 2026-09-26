import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #435 in top-commanders.txt.
//
// Rulings:
//   [2018-07-13] The effect of Aminatou's third ability lasts indefinitely. It continues to apply
//     after Aminatou (or her controller) leaves the game.
//   [2018-07-13] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2018-07-13] In a multiplayer game, if a player leaves the game, all cards that player owns
//     leave as well. The effect of Aminatou's third ability stops applying to all permanents that
//     player controlled and control of them reverts to their previous controller.
//   [2018-07-13] In a two-player game, each player gains control of each permanent the other
//     controls (aside from Aminatou) no matter which direction you choose.
//   [2018-07-13] As Aminatou's third ability resolves, you choose a direction, then each player
//     takes control of their new permanents at the same time.
//   [2018-07-13] You draw a card and put one back all while Aminatou's first ability is resolving.
//     Nothing can happen between the two, and no player may choose to take actions.
//   [2018-07-13] Once the exiled permanent returns, it's considered a new object with no relation
//     to the object that it was. Auras attached to the exiled permanent will be put into their
//     owners' graveyards. Equipment attached to the exiled permanent will become unattached and
//     remain on the battlefield. Any counters on the exiled permanent will cease to exist.
//   [2018-07-13] Aminatou's second ability can target any permanent you own, including those
//     another player controls.
//
// The direction is chosen as the −6 resolves (a `modal` with one mode each
// way): left is onward in turn order, as turn order passes to the left (rule
// 101.4).

const PLUS_TEXT = "+1: Draw a card, then put a card from your hand on top of your library.";
const BLINK_TEXT =
  "−1: Exile another target permanent you own, then return it to the battlefield under your control.";
const ROTATE_TEXT =
  "−6: Choose left or right. Each player gains control of all nonland permanents other than " +
  "Aminatou controlled by the next player in the chosen direction.";

const rotate = (direction: "left" | "right"): EffectSpec => ({
  kind: "rotate-control",
  direction,
  filter: { notTypes: ["land"] },
  exceptSource: true,
});

export default defineCard({
  name: "Aminatou, the Fateshifter",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Aminatou"],
  loyalty: 3,
  canBeCommander: true,
  text: `${PLUS_TEXT}\n${BLINK_TEXT}\n${ROTATE_TEXT}\nAminatou, the Fateshifter can be your commander.`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "look-and-choose", zone: "hand", min: 1, max: 1, destination: "library-top", leftover: "stay" },
        ],
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -1,
      cost: { mana: null, tap: false },
      // Any permanent you own, whoever controls it (the ruling).
      targets: [{ kind: "other", of: { kind: "permanent", filter: { ownedBy: "you" } } }],
      effect: { kind: "flicker", target: 0, underYourControl: true },
      resolve: null,
      text: BLINK_TEXT,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Left — each player gains control of the nonland permanents (but Aminatou) of the next player in turn order",
            effect: rotate("left"),
          },
          {
            text: "Right — each player gains control of the nonland permanents (but Aminatou) of the previous player in turn order",
            effect: rotate("right"),
          },
        ],
      },
      resolve: null,
      text: ROTATE_TEXT,
    },
  ],
});
