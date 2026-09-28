import { defineCard } from "../define.js";

// Any player's Warrior (her controller decides whether), and the token is its
// controller's — who, as the attacking player, chooses what it attacks
// (ruling; rule 508.4). It was never declared, so it doesn't trigger her
// again (508.3a). Untapping an attacker leaves it in combat (ruling), and no
// main phase comes before the extra combat.
const ATTACK_TEXT =
  "Whenever a Warrior attacks, you may have its controller create a 1/1 white Warrior creature token that's tapped and attacking.";
const ACTIVATED_TEXT =
  "{W}{U}{B}{R}{G}: Untap all attacking creatures. They gain trample, lifelink, and haste until end of turn. After this phase, there is an additional combat phase. Activate only during combat.";

const attacking = { type: "creature", attacking: true } as const;

export default defineCard({
  name: "Najeela, the Blade-Blossom",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 2,
  text: `${ATTACK_TEXT}\n${ACTIVATED_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "any", filter: { subtype: "Warrior" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Have the Warrior's controller create a 1/1 Warrior token that's tapped and attacking?",
        effect: {
          kind: "create-token",
          token: "Warrior Token",
          count: 1,
          who: "trigger-controller",
          tapped: true,
          attacking: "choose",
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: false },
      condition: { kind: "turn-structure", duringCombat: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: attacking },
          { kind: "grant-keyword-all", filter: attacking, keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: attacking, keyword: "lifelink", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: attacking, keyword: "haste", duration: "end-of-turn" },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: ACTIVATED_TEXT,
    },
  ],
});
