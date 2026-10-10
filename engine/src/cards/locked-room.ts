/**
 * A Room with both doors locked (rule 709.5): its shared type line —
 * Enchantment — Room — and nothing else, since a locked door's name, mana
 * cost and rules text aren't the permanent's. Not a card: no deck holds it
 * and `card:verify` never sees it, so `createDefaultRegistry` registers it by
 * hand, as it does the face-down 2/2s. The name is a registry key only —
 * `LOCKED_ROOM` in `state.ts` — and `nameOf` answers it for a permanent with
 * no name.
 */

import { LOCKED_ROOM } from "../state.js";
import { defineCard } from "./define.js";
import type { CardDefinition } from "./define.js";

export const LOCKED_ROOM_DEFINITION: CardDefinition = defineCard({
  name: LOCKED_ROOM,
  colors: [],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: "",
});
