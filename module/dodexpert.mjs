// Import document classes.
import { DODExpertItemProxy } from "./documents/itemproxy.mjs";
import { DODExpertActor } from "./documents/actor.mjs";
import { DODExpertItem } from "./documents/item.mjs";
// Import sheet classes.
import { DODExpertActorSheet } from "./sheets/actor-sheet.mjs";
import { DODExpertItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { DOD_EXPERT } from "./helpers/config.mjs";

import * as ChatLog from "./chatlog.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.dodexpert = {
    DODExpertActor,
    DODExpertItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.DOD_EXPERT = DOD_EXPERT;

  
  registerSystemSettings();

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @initiative",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = DODExpertActor;
  CONFIG.Item.documentClass = DODExpertItemProxy;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("dodexpert", DODExpertActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("dodexpert", DODExpertItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});

function objectSize(o) {
  if (o instanceof Array) {
    return o.length;
  }
  return Object.keys(o).length;  
}

function calcPadCount(list, count, offset) {
  const size = objectSize(list);

  if (offset) {
    return count - offset - size;
  }

  return count - size;
}

function pageFill(list, count, offset, options) {
  const padCount = calcPadCount(list, count, 0);
  let buf = '';
  for (let i = 0 ; i < padCount ; ++i) {
    buf += options.fn();
  }
  return buf;
}
Handlebars.registerHelper('pagefill', function (list, count, offset, options) {
  return pageFill(list, count, offset, options);
});

Handlebars.registerHelper('padlist', function (list, count, options) {
  return pageFill(list, count, 0, options);
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('crossboxes', function (stat, max, current, total, options) {
  let buf = '';
  for (let i = 0 ; i < total ; ++i) {
    if (i < max) {
      if (i < (max - current)) {
        buf += '<input type="checkbox" checked class="increase-' + stat+ '">';
      } else {
        buf += '<input type="checkbox" class="deduct-' + stat+ '">';

      }
    } else {
      buf += '<input type="checkbox" disabled>';

    }
  }
  return buf;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.on("renderTokenHUD", async (obj, html) => {
  console.log('renderTokenHUD, obj:');
  console.log(obj);
  console.log('renderTokenHUD, html:');
  const h = html;
  console.log(h);
});


Hooks.on("renderChatLog", async (app, html, data) => {
  ChatLog.renderChatLog(app, html, data);
});

Hooks.on("getChatLogEntryContext", async (html, options) => {
  ChatLog.getChatLogEntryContext(html, options);
});

function registerSystemSettings() {
  game.settings.register("dodexpert", "myTestSetting", {
    config: true,
    scope: "client",
    "name": "Test setting",
    hint: "Kent testar",
    type: String,
    choices: {
      "a": "Option A",
      "b": "Option B"
    },
    default: "a"
  });
}
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**a
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.dodexpert.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "dodexpert.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}