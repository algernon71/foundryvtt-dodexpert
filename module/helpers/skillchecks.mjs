
export class CheckModifier {

    constructor(id, name, modifier) {
      this.id = id;
      this.update(name, modifier);
    }
  
    update(name, modifier) {
      this.name = name;
      this.modifierString = modifier;
      this.description = modifier;
      this.active = false;
      this.numerator = null;
      this.denominator = null;
      this.mod = null;
      if (modifier.startsWith('x')) {
        const dp = modifier.indexOf('/');
        if (dp > 0) {
          this.numerator = Number(modifier.substring(1, dp));
          this.denominator = Number(modifier.substring(dp + 1));
        } else {
          this.numerator = Number(modifier.substring(1));
        }
      } else {
        this.mod = Number(modifier);
        if (modifier.startsWith('-')) {
  
        }
      }
  
    }
  
  
    apply(cl) {
      const clIn = cl;
      if (this.numerator) {
        cl = cl * this.numerator;
      }
      if (this.denominator) {
        cl = cl / this.denominator;
      }
  
      if (this.mod) {
        cl = cl + this.mod;
      }
  
      if (clIn !== cl) {
        // console.info(this.name + ' ' + clIn + this.modifierString + ' = ' + cl);
        this.active = true;
      } else {
        this.active = false;
      }
      return cl;
    }
  
  
  
  }
  
  export class CheckResult {
  }
  
  export class Check {
  
    constructor(title, basename, basecl) {
      this.title = title;
      this.basename = basename;
      this.basecl = basecl;
      this.cl = this.basecl;
      this.modifiers = [];
    }
  
    updateModifier(id, modName, modifier) {
      let m = null;
      for (let i = 0; i < this.modifiers.length; ++i) {
        if (this.modifiers[i].id === id) {
          m = this.modifiers[i];
        }
      }
  
      if (m) {
        m.update(modName, modifier);
      } else {
        m = new CheckModifier(id, modName, modifier);
        this.modifiers.push(m);
      }
  
      this.recalculate();
  
    }
  
  
    recalculate() {
      let cl = Number(this.basecl);
  
      for (let i = 0; i < this.modifiers.length; ++i) {
        cl = this.modifiers[i].apply(cl);
      }
      this.cl = cl;
      let descr = this.name + ' ' + this.basename + ' ' + this.basecl + ' ';
      for (let i = 0; i < this.modifiers.length; ++i) {
        const modifier = this.modifiers[i];
        if (modifier.active) {
          descr += modifier.modifierString + ' ';
  
        }
      }
      descr += ' = CL: ' + cl;
      console.info(descr);
    }
  
    async render() {
      const content = await renderTemplate("systems/dodexpert/templates/check/check.html", this);
      return content;
  
    }
  }
  