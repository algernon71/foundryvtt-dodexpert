import { AddSkillDialog } from "../dialogs/AddSkillDialog.mjs"
import { AddMagicSchoolDialog } from "../dialogs/AddMagicSchoolDialog.mjs"
import { AttackDialog } from "../dialogs/AttackDialog.mjs"
import { CastSpellDialog } from "../dialogs/CastSpellDialog.mjs"


import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

import { races, bodyShapes } from "../constants.mjs";

const sheetStyles = [
  {
    "id": "classic",
    "name": "Expert classic",
    "tabs": [
      {
        "id": "front",
        "label": "Framsida",
        "path": "systems/dodexpert/templates/actor/character/classic/front.html"
      },
      {
        "id": "back",
        "label": "Baksida",
        "path": "systems/dodexpert/templates/actor/character/classic/back.html"
      }
    ]
  }
];
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DODExpertActorSheet extends ActorSheet {
  selectableSkills = [];
  selectedSkill = null;
  selectedSkillIndex = 0;
  listTypes = {};
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["dodexpert", "sheet", "actor"],
      template: "systems/dodexpert/templates/actor/expert-character-sheet.html",
      width: 800,
      height: 1000,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/dodexpert/templates/actor/${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    const permissionLevel = context.document.getUserLevel(game.user);
    switch (permissionLevel) {
      case 0:
      case 1:
        context.showSheets = game.user.isGM;

        break;
      case 2:
      case 3:
        context.showSheets = true;
        break;
    }

    // Prepare character data and items.
    switch (actorData.type) {
      case 'character':
      case 'npc':
        this._prepareItems(context);
        this._prepareCharacterData(context);
        break;
    }


    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    context.bodyShape = bodyShapes["humanoid"];
    context.game = game;
    context.isGM = game.user.isGM;
    context.sheetStyles = sheetStyles;
    context.sheet = sheetStyles[0];
    context.tabs = [];
    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {

    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize('dodexpert.abilities.' + k + '.label') ?? k;
    }
    const bodyShape = bodyShapes["humanoid"];

    const kpOffset = Math.floor((context.system.health.max - 5) / 3) - 1;

  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const skills = {
      listTitle: 'FÄRDIGHETER',
      pack: 'dodexpert.skills',
      addTitle: 'Lägg till',
      type: 'skill',
      deftype: 'skilldef',
      excludeSubtypes: ["MAG"],
      list: []
    };
    const spells = {
      listTitle: 'BESVÄRJELSER',
      pack: 'dodexpert.spells',
      addTitle: 'Lägg till',
      type: 'spell',
      deftype: 'spelldef',
      list: []
    };
    const magicSchools = {
      listTitle: 'MAGISKOLOR',
      pack: 'dodexpert.skills',
      addTitle: 'Lägg till',
      type: 'skill',
      deftype: 'skilldef',
      includeSubtypes: ["MAG"],
      list: []
    };
    const favoriteSkills = [];
    const languages = [];
    const weapons = [];
    const shields = [];
    let carriedWeight = 0;



    let itemsToRemove = [];
    for (let i of context.items) {
      switch (i.type) {
        case "skilldef":
          itemsToRemove.push(i);
          break;
      }
    }

    for (let i of itemsToRemove) {
      const skillId = i._id;
      const skill = this.actor.items.get(skillId);
      skill.delete();
      console.info('remove:', i);
    }

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;

      this.addToList(skills, i);
      this.addToList(spells, i);
      this.addToList(magicSchools, i);
      // Append to gear.
    }
    for (let i of context.items) {
      if (i.system.weight) {
        carriedWeight += Number(i.system.weight);
      }
      switch (i.type) {
        case "item":
          gear.push(i);
          break;
        case "weapon":
          weapons.push(i);
          gear.push(i);
          break;
        case "shield":
          shields.push(i);
          gear.push(i);
          break;
        }
    }



      this.listTypes.skills = skills;
    this.listTypes.magicSchools = magicSchools;
    this.listTypes.spells = spells;

    context.gear = gear;
    context.weapons = weapons;
    context.shields = shields;
    context.skills = skills;
    context.favoriteSkills = favoriteSkills;
    context.spells = spells;
    context.languages = languages;
    context.magicSchools = magicSchools;
    context.isGM = game.user.isGM;
    context.carriedWeight = carriedWeight;
    console.info('context:', context);
  }

  addToList(list, item) {
    if (this.inList(list, item)) {
      list.list.push(item);
    }
  }

  inList(list, item) {
    if (item.type != list.type) {
      return false;
    }

    if (list.includeSubtypes) {
      if (!list.includeSubtypes.find(subtype => subtype == item.system.category)) {
        return false;
      }
    }
    if (list.excludeSubtypes) {
      if (list.excludeSubtypes.find(subtype => subtype == item.system.category)) {
        return false;
      }
    }

    return true;
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });
 
    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.find('.increase-health').click(this._onIncreaseHealth.bind(this));
    html.find('.deduct-health').click(this._onDeductHealth.bind(this));
    html.find('.add-item').click(this._onAddItem.bind(this));
    html.find('.increase-power').click(this._onIncreasePower.bind(this));
    html.find('.deduct-power').click(this._onDeductPower.bind(this));
    // Add Inventory Item
    html.find('.add-skill').click(this._onAddSkill.bind(this));
    html.find('.cast').click(this._onCastSpell.bind(this));
    html.find('.use-item').click(this._onUseItem.bind(this));
    html.find('.fv-input').keyup(this._onSkillUpdate.bind(this));
    html.find('.add-experience').click(this._onSkillExperienceAdd.bind(this));
    html.find('.minus-experience').click(this._onSkillExperienceRemove.bind(this));
    html.find('.toggle-favorite').click(this._onSkillToggleFavorite.bind(this));
    html.find(".inline-edit").change(this._onItemInlineEdit.bind(this));

    new ContextMenu(html, '.skill', [
      {
        name: game.i18n.localize('dodexpert.menus.edit'),
        icon: '<i class="fas fa-edit"></i>',
        condition: element => game.user.isGM,
        callback: element => {
          const skillId = element.data("skill");
          const items = this.actor.items;
          const skill = this.actor.items.get(skillId);

          console.info('Edit skill entry:', skill);
          skill.skillDef.sheet.render(true);
        },

      },
      {
        name: game.i18n.localize('dodexpert.menus.delete'),
        icon: '<i class="fas fa-trash"></i>',
        callback: element => {
          const skillId = element.data("skill");
          const skill = this.actor.items.get(skillId);
          skill.delete();
        },

      }
    ]);
    new ContextMenu(html, '.editable-item', [
      {
        name: game.i18n.localize('dodexpert.menus.edit'),
        icon: '<i class="fas fa-edit"></i>',
        condition: element => game.user.isGM,
        callback: element => {
          const itemId = element.data("item-id");
          const items = this.actor.items;
          const item = this.actor.items.get(itemId);

          item.sheet.render(true);
        },

      },
      {
        name: game.i18n.localize('dodexpert.menus.delete'),
        icon: '<i class="fas fa-trash"></i>',
        callback: element => {
          const itemId = element.data("item-id");
          const item = this.actor.items.get(itemId);
          item.delete();
        },

      }
    ]);
    new ContextMenu(html, '.skill-erf', [
      {
        name: game.i18n.localize('dodexpert.menus.add-xp'),
        icon: '<i class="fas fa-plus"></i>',
        callback: element => {
          const skillId = element.data("skill");
          this.addSkillExperience(skillId);
        }

      }
    ]);
    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  async _onItemInlineEdit(event) {
    console.info('inline-edit:', event);
    event.preventDefault();
    const element = event.currentTarget;
    const itemElement = element.closest(".item");
    const itemId = itemElement.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const field = element.dataset.field;
    return item.update({ [field]: element.value });

  }
  async addSkillExperience(skillId) {

    const item = this.actor.items.get(skillId);
    if (item) {
      await item.giveExperience(1);
      this.render();
    }

  }
  async _onSkillExperienceAdd(event) {

    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = data.skill;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.giveExperience(1);
      this.render();
    }

  }

  async _onSkillExperienceRemove(event) {

    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = data.skill;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.removeExperience(1);
      this.render();
    }

  }
  async _onSkillToggleFavorite(event) {

    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = $(a).parents('.item').attr('data-item-id');
    const item = this.actor.items.get(itemId);
    if (item) {
      const favorite = item.system.favorite;
      let update = {
        "system":
        {
          "favorite": !favorite
        }
      };
      await item.update(update, {});
    }

  }

  async _onDeductHealth(event) {
    const health = this.actor.system.health.value;
    let update = {
      "system": {
        "health":
          { "value": health - 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onIncreaseHealth(event) {
    const health = this.actor.system.health.value;
    let update = {
      "system": {
        "health":
          { "value": health + 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onDeductPower(event) {
    console.info('_onDeductPower');
    const power = this.actor.system.power.value;
    let update = {
      "system": {
        "power":
          { "value": power - 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onIncreasePower(event) {
    console.info('_onIncreasePower');
    const power = this.actor.system.power.value;
    let update = {
      "system": {
        "power":
          { "value": power + 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onSkillUpdate(event) {
    console.log('_onSkillUpdate', event);
    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = $(a).parents('.item').attr('data-item-id');
    const item = this.actor.items.get(itemId);

    if (item) {
      console.log('_onSkillUpdate, item:', item);
      let update = { "system": { "fv": "15" } };
      await item.update(update, {});
      this.render();
    }
  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    console.log('_onRoll', event);
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.log('_onRoll dataset:', dataset);
    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  async _onUseItem(event) {


    console.log('_onUseItem, event:', event);
    const element = event.currentTarget;
    const dataset = element.dataset;
    const item = this.actor.items.get(dataset.itemId);
    item.use(event);
  }
  async _onAddSkill(event) {
    const header = event.currentTarget;
    const listTypeName = header.dataset.listtype;

    const listType = this.listTypes[listTypeName];
    this.dialog = new AddSkillDialog(this.actor, listType);
    this.dialog.render(true, {
      renderData: {}
    });
  }

  async _onAddItem(event) {
    const itemData = { type: "item", name: "?"};
    const item = await Item.create(itemData, { parent: this.actor });
    item.sheet.render(true);
  }

  
  async _onCastSpell(event) {
    this.dialog = new CastSpellDialog({ actor: this.actor });
    this.dialog.render(true, {
      renderData: {}
    });
  }
  
}
