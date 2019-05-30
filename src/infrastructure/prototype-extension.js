class PrototypeExtension {

  constructor({ bluebird }) {
    if (bluebird) {
      this.bluebird = bluebird;
    }
  }

  register() {
    this.registerString();
    this.registerDate();
    this.registerObject();
  }

  registerString() {
    // Empty
    String.empty = "";

    // Whitespace
    String.whiteSpace = " ";

    // To title case
    String.prototype.toTitleCase = function() {
      return this.replace(/\w\S*/g, function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };

    // To integer
    String.prototype.toInt = function(base = 10) { return parseInt(this, base); };

     // To float
     String.prototype.toFloat = function() { return parseFloat(this); };

    // Is number
    String.prototype.isNumber = function() { return !isNaN(this); };

    // Pascal to param case
    String.prototype.pascalToParamCase = function() { return this.replace(/([A-Z])/g, x => `-${x.toLowerCase()}`).substring(1); };

    // Camel to param case
    String.prototype.camelToParamCase = function() { return this.replace(/[A-Z]/g, x => `-${x.toLowerCase()}`); };

    // Capitalize
    String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1); };

    // Replace all
    String.prototype.replaceAll = function(search, replacement) { return this.replace(new RegExp(search, 'g'), replacement); };
    
  }

  registerDate() {
    // To UTC sql string
    Date.prototype.toUtcSqlString = function()  { return this.toISOString().slice(0, 19).replace('T', ' '); };

    // Add days
    Date.prototype.addDays = function(days) { 
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    // Remove days
    Date.prototype.removeDays = function(days) { 
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() - days);
      return date;
    };

  }

  registerObject() {
    // Is empty
    Object.isEmpty = function(obj) {
      let isEmpty = true;
      for(let key in obj) { if(obj[key] !== undefined) { isEmpty = false; break; } }
      return isEmpty;
    };

    // Flat array
    Array.prototype.flat = function(depth = 1) {
        return this.reduce(function (flat, toFlatten) {
          return flat.concat((Array.isArray(toFlatten) && (depth-1)) ? toFlatten.flat(depth-1) : toFlatten);
        }, []);
    };

    Array.prototype.equals = function (array) {
      // if the other array is a falsy value, return
      if (!array)
          return false;

      // compare lengths - can save a lot of time 
      if (this.length != array.length)
          return false;

      for (var i = 0, l=this.length; i < l; i++) {
          // Check if we have nested arrays
          if (this[i] instanceof Array && array[i] instanceof Array) {
              // recurse into the nested arrays
              if (!this[i].equals(array[i]))
                  return false;       
          }           
          else if (this[i] != array[i]) { 
              // Warning - two different object instances will never be equal: {x:20} != {x:20}
              return false;   
          }           
      }       
      return true;
    };

    // Hide method from for-in loops
    Object.defineProperty(Array.prototype, "equals", { enumerable: false });

    // First
    Array.prototype.first = function() { return this[0] || undefined; };

    // Last
    Array.prototype.last = function() { return this[this.length - 1] || undefined; };

     // SortAsc
     Array.prototype.sortAsc = function() { return this.sort(function(a, b) { return a - b; }); };

     // SortDesc
     Array.prototype.sortDesc = function() { return this.sort(function(a, b) { return b - a; }) || undefined; };  

     // Max
     Array.prototype.max = function() { return this.sort(function(a, b) { return b - a; })[0] || undefined; };  

     // Min
     Array.prototype.min = function() { return this.sort(function(a, b) { return a - b; })[0] || undefined; }; 

    // Change promise to bluebird implementation
    if (this.bluebird) { global.Promise = Promise = this.bluebird; }

  }

}

module.exports = PrototypeExtension;
