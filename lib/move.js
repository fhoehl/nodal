(function () {
    var move = {},
        events = {},
        trace = true;

    if (typeof define !== "undefined") {
        define([], function () { return move; });
    }
    else if (typeof window !== "undefined") {
        window.move = move;
    }
    else {
        module.exports = move;
    }

    move.Object = function () {
        var len = arguments.length,
            body = arguments[len - 1],
            extendObject = len > 1 ? arguments[0] : null,
            hasImplementObject = len > 2,
            MoveObject, SuperMoveObject;
        
        if (body.constructor === Object) {
            MoveObject = function() {};
        }
        else {
            MoveObject = body.constructor;
            delete body.constructor;
        }

        if(extendObject) {
            SuperMoveObject = function() {};
            SuperMoveObject.prototype = extendObject.prototype;
            MoveObject.prototype = new SuperMoveObject();
            MoveObject.Super = SuperMoveObject;
            extend(MoveObject, SuperMoveObject, false);
        }

        if (hasImplementObject) {
            var i;
            for (i = 1; i < len - 1; i++) {
                extend(MoveObject.prototype, arguments[i].prototype, false);
            }
        }

        MoveObject.prototype.bind = move.bind;
        MoveObject.prototype.unbind = move.unbind;
        MoveObject.prototype.trigger = move.trigger;
        extend(MoveObject.prototype, body, true);

        return MoveObject;
    };

     
    move.bind = function(event, handler, parentObject) {
        this.events = this.events || {};
        this.events[event] = this.events[event] || [];
        this.events[event].push(handler);
    };

    move.unbind = function(event, handler) {
        this.events = this.events || {};
        if(event in this.events === false) { return; }
        this.events[event].splice(this.events[event].indexOf(handler), 1);
    };

    move.trigger = function(event) {
        if (trace) { console.log("Event:", arguments); }

        this.events = this.events || {};
        if(event in this.events === false) { return; }
        for(var i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };

    var extend = function(obj, extension, override) {
        var prop;
        
        if (override === false) {
            for (prop in extension) {
                if (!(prop in obj)) {
                    obj[prop] = extension[prop];
                }
            }
        }
        else {
            for (prop in extension) {
                obj[prop] = extension[prop];
            }
            if (extension.toString !== Object.prototype.toString) {
                obj.toString = extension.toString;
            }
        }
    };

})();
