import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, you gain 3 life and you may return up to one target creature card from your graveyard to your hand.";

// With no target chosen it just gains the 3 life; a target that is illegal
// by resolution means no life either (the rulings — rule 608.2b).
export default defineCard({
  name: "Sword of Light and Shadow",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+2 and has protection from white and from black.\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["W", "B"] },
      text: "Equipped creature gets +2/+2 and has protection from white and from black.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 3 },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: {} },
            then: {
              kind: "may",
              prompt: "Return the targeted creature card to your hand?",
              effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
            },
          },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
