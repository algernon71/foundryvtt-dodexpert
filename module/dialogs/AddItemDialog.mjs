
function compareNumbers(a, b) {
  return a - b;
}


export class AddItemDialog extends FormApplication {

  constructor(actor, data) {
    super(data, {
      title: game.i18n.localize('dodexpert.dialogs.selectitem.' + data.type + '.title')
    });
    this.data = data;
    this.actor = actor;

    this.search = '';
    this.selected = null;
    this.selectedIndex = -1;
    this.selectedElement = null;
    this.added = [];

  }

  /**
   * @override
   */
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      closeOnSubmit: false,
      height: 800,
      width: 600,
      id: 'select-item-dialog',
      submitOnChange: true,
      template: "systems/dodexpert/templates/dialog/add-item-dialog.html",
      userId: game.userId,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }



  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;

    context.actor = this.actor;
    context.type = this.data.type;
    context.searchString = this.searchString;

    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
  /**
   * Callback passed to Button Click event listener which handles it
   * 
   * @param {MouseEvent} event - the triggering mouse click event
   */
  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;

  }

  /**
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);

    const t = this;
    this.inputElement = document.querySelector('#search-input');
    this.addButton = document.querySelector('#add-button');
    this.newButton = document.querySelector('#new-button')

    this.addButton.addEventListener("click", this.addItem.bind(this));
    this.newButton.addEventListener("click", this.newItem.bind(this));

    this.inputElement.addEventListener("input", this._onUpdateSearch.bind(this));
    this.inputElement.addEventListener("keydown", function (e) {
      if (e.keyCode == 40) {
        t.selectNextItem();
      } else if (e.keyCode == 38) { //up
        t.selectPreviousItem();
      } else if (e.keyCode == 13) {
        t.addItem();
      }
    });
    this.matchListElement = document.querySelector('#match-list');
    this.selectedInfoElement = document.querySelector('#add-selected');
    const allItems = Items.instance;
    this.updateMatchList('');
  }

  _onUpdateSearch(event) {
    console.info('_onUpdateSearch', event);

    this.updateMatchList(this.inputElement.value);
  }


  sortOrder(item) {
    /*
    if (item.system.sortorder) {
      return Number(item.system.sortorder);
    }*/

    return 10;
  }
  async filterMatches(searchString) {
    const resultsList = [];
    this.matcheditems = [];

    game.items.forEach((item, key) => {
      if (this.matchItem(item, searchString)) {
        this.matcheditems.push(item);
      }
    });

    const itemsPack = game.packs.get(this.data.pack);

    game.packs.forEach(async gamePack => {
      console.info('Checking pack:', gamePack);
      const index = await gamePack.getIndex({ fields: this.getFields() });
      index.forEach((item, key) => {
        if (this.matchItem(item, searchString)) {
          item.pack = gamePack;
          this.matcheditems.push(item);
        }
      });
      this.matcheditems.sort((a, b) => this.compareItems(a, b));
      this.populateMatchList();
    });

  }

  compareItems(a, b) {
    if (a.name && b.name) {
      // return a.name.localCompare(b.name);
      return 10;
    }
    return 10;
  }

  getActorMagicSchools() {
    this.data.magicSchools = {};
    this.actor.items.forEach(item => {
      if (item.type == "item" && item.system.category == "MAG") {
        console.info('school:', item);
        const schoolId = item.itemDef.system.schoolId;
        this.data.magicSchools[schoolId] = item;
      }
    });
  }
  getFields() {
    switch (this.data.type) {
      case "weapon":
        return ["system.damage", "system.weight", "system.range"];
      case "armor":
        return ["system.abs", "system.weight"];

      default:
        return [];
    }
  }
  getColumnFields() {
    switch (this.data.type) {
      case "weapon":
        return ["damage", "weight", "range"];
      case "armor":
        return ["abs", "weight"];

      default:
        return [];
    }
  }

  matchItem(item, searchString) {

    if (item.type != this.data.type) {
      return false;
    }

    if (!item.name.toLowerCase().includes(searchString.toLowerCase())) {
      return false;
    }

    return true;
  }

  async updateMatchList(searchString) {
    this.searchString = searchString;
    this.newButton.textContent = game.i18n.localize('dodexpert.dialogs.selectitem.new') + '"' + this.searchString + '" ...';
    await this.filterMatches(searchString);

  }

  async populateMatchList() {
    this.clearSelect();
    this.matchListElement.innerHTML = "";
    let innerElement = "";
    const t = this;
    this.matchEntryElements = [];

    this.matcheditems.forEach((item, index) => {
      const matchEntry = document.createElement('DIV');
      matchEntry.innerHTML = t.buildMatchEntryHTML(item, index, false);
      matchEntry.addEventListener("click", function (e) {
        t.selectItem(index);
      });
      matchEntry.addEventListener("dblclick", function (e) {
        t.selectItem(index);
        t.addItem(e);
      });
      this.matchListElement.appendChild(matchEntry);
      this.matchEntryElements.push(matchEntry);

    });
    if (this.matchEntryElements.length > 0) {
      this.selectNextItem();
    }
  }

  buildMatchEntryHTML(item, index, selected) {
    let fields = this.getColumnFields();
    let html = '';

    html += `<div class="match-entry" id="match-entry-${index}">`;
    html += `<div class="match-name">${item.name}</div>`;
    for (let i = 0 ; i < fields.length ; ++i) {
      let fieldName = fields[i];
      let value = item['system'][fieldName];
      if (value) {
        html += `<div class="match-name">${fieldName}: ${value}</div>`;
      }
      
    }
    html += `</div>`;

    return html;
  }


  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.calculate();
  }




  selectPreviousItem() {
    if (this.selectedIndex < 0) {
      return;
    }

    this.selectItem(this.selectedIndex - 1);
  }
  selectNextItem() {
    if (this.selectedIndex >= this.matcheditems.length) {
      return;
    }

    this.selectItem(this.selectedIndex + 1);
  }

  clearSelect() {
    if (this.selected) {
      const element = document.querySelector('#match-entry-' + this.selectedIndex);
      element.classList.remove("selected-entry");
    }
    this.selected = null;
    this.selectedIndex = -1;
    this.selectedElement = null;
    this.selectedInfoElement.style.display = 'none';

  }
  async selectItem(index) {
    console.info('selectItem: ' + index);
    if (this.selected) {
      const element = document.querySelector('#match-entry-' + this.selectedIndex);
      element.classList.remove("selected-entry");
    }
    const item = this.matcheditems[index];
    let itemObject = null;
    this.selected = item;
    this.selectedIndex = index;
    if (item.pack) {
      itemObject = await item.pack.getDocument(this.selected._id);
    } else {
      itemObject = game.items.get(this.selected._id);
    }

    const element = document.querySelector('#match-entry-' + index);
    //    element.innerHTML = this.buildMatchEntryHTML(item, index, true);
    element.classList.add("selected-entry");

    //    this.selectedInfoElement.innerHTML = this.renderitemDescription(itemObject);

    // this.selectedInfoElement.style.display = 'block';
  }

  async getSelectedItemObject() {
    if (this.selected.pack) {
      return await this.selected.pack.getDocument(this.selected._id);
    } else {
      return game.items.get(this.selected._id);
    }

  }
  renderitemDescription(item) {
    let innerHtml = `
    <div class="selected-item-name">${item.name}</div>
    <div class="selected-item-cost">Kostnad: ${item.system.cost}</div>
    <div class="selected-item-ability">Grundegenskap: ${item.system.ability}</div>
    <div class="selected-item-type">Typ: ${item.system.type}-färdighet</div>`;
    if (item.bc) {
      innerHtml += `<div class="selected-item-type">BC: ${item.system.ability}</div>`;
    } else {
      innerHtml += `<div class="selected-item-type">BC: 0</div>`;
    }
    innerHtml += `<div class="selected-item-description"> ${item.system.description}</div>`;
    return innerHtml;
  }


  async addItem(event) {
    this.close();
    const itemsPack = this.selected.pack;
    let item = this.selected;
    let packId = null;
    if (itemsPack) {
      item = await itemsPack.getDocument(this.selected._id);
      packId = itemsPack.metadata.id;
    }
    console.info('addItem:', item);
    //    const itemData = game.items.fromCompendium(item);
    const itemData = await this.getSelectedItemObject();
    console.info('itemData:', itemData);
    this.added.push(itemData);
    const newItem = await Item.create(itemData, { parent: this.actor });

    this.inputElement.value = "";
    this.updateMatchList('');
    // this.close();
  }

  async newItem(event) {
    this.close();
    const itemData = {
      name: this.searchString,
      type: this.data.type,
    };
    const newItem = await Item.create(itemData, { parent: this.actor });
    newItemDef.sheet.render(true);
  }

}


