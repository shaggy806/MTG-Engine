import { roomCard } from "../helpers.js";
import left from "./mirror-room.js";
import right from "./fractured-realm.js";

// EDHREC rank 2805. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Mirror Room // Fractured Realm", left, right);
