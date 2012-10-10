/*! nodal - v0.1.0 - 2012-10-10
* https://github.com/fhoehl/nodal
* Copyright (c) 2012 fhoehl; Licensed MIT */

(function(exports) {

var document = this.window.document,
    location = this.window.location,
    navigator = this.window.navigator,
    nodal = {
        model: {},
        view: {},
        layout: {},
        loader: {}
    };
    
exports.nodal = nodal;

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

nodal.loader = {
    loadJSON: function(json) {
        var g = new nodal.model.Graph(),
            verticesData, edgesData,
            vetexData, edgeData,
            vertices = {}, edges = {},
            inV, outV,
            inVIndex, outVIndex;

        if (json["vertices"]) {
            verticesData = json["vertices"];
            verticesData.forEach(function(vertexData) {
                vertices[vertexData._id] = g.v.add(vertexData._type, vertexData);
            });
        }

        if (json["edges"]) {
            edgesData = json["edges"];
            edgesData.forEach(function(edgeData) {
                inVIndex = edgeData._inV.split(":");
                outVIndex = edgeData._outV.split(":");
                inV = vertices[inVIndex[0]];
                outV = vertices[outVIndex[0]];
                if (inV && outV) {
                    g.e.add(inV, inVIndex[1], outV, outVIndex[1], edgeData._label, edgeData);
                }
            });
        }
        
        return g;
    }
};

nodal.model.Graph = function() {
    this.vertices = [];
    this.edges = [];
    this.adjacency = {};

    //Aliases.
    this.v = {
        all: this.vertices,
        add: this.addVertex.bind(this)
    };
    this.e = {
        all: this.edges,
        add: this.addEdge.bind(this)
    };
};

nodal.model.Graph.prototype = {
    vId: 0,
    
    addVertex: function(type, props) {
        props._type = type;

        var vertex = new nodal.model.Vertex(this.vId, this, props);

        if (!(vertex.id in this.adjacency)) {
            this.vertices.push(vertex);
            this.adjacency[vertex._id] = vertex;
        }

        this.vId += 1;
        
        return vertex;
    },

    getVertex: function(id) {
        return this.adjacency[id];
    },

    addEdge: function(srcVertex, outputIndex, dstVertex, inputIndex, label, props) {
        var exist = false,
            edge = null,
            i, j;

        if (this.vertices.indexOf(srcVertex) > -1
            && this.vertices.indexOf(dstVertex) > -1) {}
        else {
            throw new Error("Vertex id already present.");
        }

        for (i = 0; edge = this.edges[i]; i++) {
            if (edge.inV == srcVertex
                && edge.outV == dstVertex) {
                delete this.edges[i];
            }
        }

        edge = new nodal.model.Edge(label, props);
        edge.inV = srcVertex;
        edge.inVIndex = inputIndex;
        edge.outV = dstVertex;
        edge.outVIndex = outputIndex;
        this.edges.push(edge);

        return edge;
    },

    deleteVertex: function(vertex) {
        var idx = this.vertices.indexOf(vertex);
        if (idx > -1) {
            this.vertices.splice(idx, 1);
        }
        
        this.edges.forEach(function(edge) {
            if (edge.inV === vertex
                || edge.outV === vertex) {
                //Can we free the edge?
                edge.inV = edge.outV = null;
            }
        }, this);
    },

    deleteEdge: function(edge) {
        var idx = this.edges.indexOf(edge);
        if (idx > -1) {
            this.edges.splice(idx, 1);
        }
    },

    toBooleanMatrix: function(propsWeightField) {
        var size = this.vertices.length,
            matrix = nodal.math.matrix.zero(size, size),
            i, j;

        this.edges.forEach(function(edge) {
            i = this.vertices.indexOf(edge.inV);
            j = this.vertices.indexOf(edge.outV);
            if (i > -1 && j > -1) {
                matrix[i][j] = 1;
            }
        }, this);

        return matrix;
    },

    toMatrix: function() {
        var size = this.vertices.length,
            matrix = nodal.math.matrix.zero(size, size),
            i, j;

        this.edges.forEach(function(edge) {
            i = this.vertices.indexOf(edge.inV);
            j = this.vertices.indexOf(edge.outV);
            if (i > -1 && j > -1) {
                matrix[i][j] = edge.props.weight;
            }
        }, this);

        return matrix;
    }
};

nodal.model.Vertex = function(id, g, props) {
    this._id = id;
    this.id = props.id || "";
    this.g = g;
    this.props = props || {};
    this.inSockets = this.props.inputs;
    this.outSockets = this.props.outputs;
    this.evaluate = this.props.evaluate;
};

nodal.model.Edge = function(label, props) {
    this._id = null;
    this.label = label || "";
    this.inV = null;
    this.inVIndex = 0;
    this.outV = null;
    this.outVIndex = 0;
    this.props = props || {};
};

nodal.view.VertexView = move.Object({
    el: null,
    outEl: [],
    inEl: [],
    model: null,

    constructor: function(model, name, inputs, outputs) {
        this.model = model;
        this.render(model, name, inputs, outputs); 
    },
     
    render: function(model, nodeType, inputs, outputs) {
        var el = document.createElement("div");

        if (model.props.className) {
            el.className = "vertex " + model.props.className;
        }
        else {
            el.className = "vertex";
        }

        el.id = "vertex-" + model._id;
        el.style.left = "0px";
        el.style.top = "0px";
        el.setAttribute("data-nodeType", nodeType);
        el.setAttribute("data-vertexId", model._id);

        var content = document.createElement("div");
        content.className = "content";
        el.appendChild(content);
        var title = document.createElement("a");
        title.className = "label";
        title.appendChild(document.createTextNode(model.props.name));
        
        title.addEventListener("mousedown", this.startDrag.bind(this), true);
        
        content.appendChild(title);

        var innerUi = $("#" + nodeType);
        
        if (innerUi.length > 0) {
            var ui = $(innerUi.html());
            var cls = this;
            $(content).append(ui);
        
            $(":input[nd-input]", ui.parent()).each(function(index, element) {
                var outputIndex = $(element).attr("nd-input");
                cls.bind("node-output-data-change", function(event) {
                    $(element).val(cls.model.inSockets[outputIndex].data);
                });
            });

            $(":input[nd-output]", ui.parent()).each(function(index, element) {
                var outputIndex = element.getAttribute("nd-output");
                
                $(element).on("change", function(event) {

                    //Updating the model.
                    cls.model.outSockets[outputIndex].data = $(element).val();
                    
                    cls.trigger("node-output-data-change", {
                        outputId: outputIndex,
                        data: $(element).val(),
                        vertex: cls.model
                    });
                });

                //Set intial value.
                cls.model.outSockets[outputIndex].data = $(element).val();
            });

            $(":input[nd-prop]", ui.parent()).each(function(index, element) {
                var propName = element.getAttribute("nd-prop");
                
                $(element).on("change", function(event) {
                    cls.model.props[propName] = event.target.value;
                    
                    cls.trigger("node-prop-change", {
                        propName: propName,
                        vertex: cls.model
                    });
                });

                //Set intial value.
                cls.model.props[propName] = element.value;
            });
        }

        var inputAnchors = document.createElement("div");
        inputAnchors.className = "input-anchors anchors";
        el.appendChild(inputAnchors);
        if (inputs) {
            var inId = 0;
            var inputsEl = [];
            for (var i in inputs) {
                var anchor = document.createElement("div");
                anchor.className = "anchor node-input";
                anchor.setAttribute("data-vertexId", model._id);
                anchor.setAttribute("data-anchorId", inId++);
                anchor.addEventListener("mousedown", this.startAnchorDrag.bind(this), false);
                anchor.innerHTML = "<span class='button'>&nbsp;</span>";
                inputAnchors.appendChild(anchor);
                inputsEl.push(anchor);
            }
            this.inEl = inputsEl;
        }

        var outputAnchors = document.createElement("div");
        outputAnchors.className = "output-anchors anchors";
        el.appendChild(outputAnchors);
        if (outputs) {
            var inId = 0;
            var outputsEl = [];
            for (var i in outputs) {
                var anchor = document.createElement("div");
                anchor.className = "anchor node-output";
                anchor.setAttribute("data-vertexId", model._id);
                anchor.setAttribute("data-anchorId", inId++);
                anchor.addEventListener("mousedown", this.startAnchorDrag.bind(this), true);
                anchor.innerHTML = "<span class='button'>&nbsp;</span>";
                outputAnchors.appendChild(anchor);
                outputsEl.push(anchor);
            }
            this.outEl = outputsEl;
        }

        var footer = document.createElement("div");
        footer.className = "footer";
        footer.innerHTML = "<span>&nbsp;</span>";
        el.appendChild(footer);

        var close = document.createElement("a");
        close.href = "#";
        close.className = "close";

        this.el = el;
    },

    startDrag: function(event) {
        if (!event.target.classList.contains("label")) {
            return;
        }

        var x = event.clientX + window.scrollX,
            y = event.clientY + window.scrollY;

        this.cursorStartX = x;
        this.cursorStartY = y;

        this.elStartLeft = parseInt(this.el.style.left, 10);
        this.elStartTop = parseInt(this.el.style.top, 10);

        $(document).on("mousemove", this.drag.bind(this));
        $(document).on("mouseup", this.endDrag.bind(this));
        
        event.preventDefault();
        event.stopPropagation();

        this.trigger("start-drag");
    },

    drag: function(event) {
        var x = event.clientX + window.scrollX,
            y = event.clientY + window.scrollY;
        
        this.el.style.left = Math.max(0, (this.elStartLeft + x - this.cursorStartX)) + "px";
        this.el.style.top = Math.max(0, (this.elStartTop + y - this.cursorStartY)) + "px";
        
        event.preventDefault();
        event.stopPropagation();
        
        this.trigger("drag", {vertex: this});
    },

    endDrag: function(event) {
        $(document).off("mousemove");
        $(document).off("mouseup");
        event.preventDefault();
        event.stopPropagation();
        this.trigger("end-drag", {vertex: this});
    },

    startAnchorDrag: function(event) {
        
        var v = this.model;
        var index = parseInt(event.target.parentElement.getAttribute("data-anchorid"), 10);
        this.model.g.e.all.forEach(function(edge) {
            if (edge.inV == v) {
                if (edge.outVIndex == index) {
                    console.log("ok");
                }
            }
            else if (edge.outV == v) {
                if (edge.inVIndex == index) {
                    console.log("ok");
                }
            }
        });

        $(document).on("mousemove", this.anchorDrag.bind(this));
        $(document).on("mouseup", this.endAnchorDrag.bind(this));
   
        this.selectedAnchorEl = event.target.parentNode;

        this.trigger("start-anchor-drag", {
            vertex: this,
            anchorEl: event.target.parentNode
        });

        event.preventDefault();
        event.stopPropagation();
    },

    anchorDrag: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger("anchor-drag", {
            vertex: this,
            srcAnchorEl: this.selectedAnchorEl,
            mouseEvent: event,
        });
    },

    endAnchorDrag: function(event) {
        $(document).off("mousemove");
        $(document).off("mouseup");
        event.preventDefault();
        event.stopPropagation();
        this.trigger("end-anchor-drag", {
            vertex: this,
            srcAnchorEl: this.selectedAnchorEl,
            dstEl: event.target
        });
    }
});

nodal.view.LinkView = move.Object({
    el: null,
    inEl: null,
    outEl: null,

    constructor: function(srcVertex, srcAnchorEl, dstVertex, dstAnchorEl) {
        var svgns = "http://www.w3.org/2000/svg";
        var shape = document.createElementNS(svgns, "line");

        var x1 = $(srcAnchorEl).offset().left + 12 - $("#nodal-editor").offset().left,
            y1 = $(srcAnchorEl).offset().top + 12 - $("#nodal-editor").offset().top,
            x2 = $(dstAnchorEl).offset().left + 12 - $("#nodal-editor").offset().left,
            y2 = $(dstAnchorEl).offset().top + 12 - $("#nodal-editor").offset().top;
        
        AA =  $(srcAnchorEl);

        shape.setAttributeNS(null, "x1", x1);
        shape.setAttributeNS(null, "y1", y1);
        shape.setAttributeNS(null, "x2", x2);
        shape.setAttributeNS(null, "y2", y2);
        shape.setAttributeNS(null, "stroke", "black");
        shape.setAttributeNS(null, "stroke-width", "5");

        this.el = shape;
        this.src = srcVertex;
        this.srcAnchorEl = srcAnchorEl;
        this.dst = dstVertex;
        this.dstAnchorEl = dstAnchorEl;
    },

    render: function(x1, y1, x2, y2) {
        var shape = this.el;
        shape.setAttributeNS(null, "x1", x1);
        shape.setAttributeNS(null, "y1", y1);
        shape.setAttributeNS(null, "x2", x2);
        shape.setAttributeNS(null, "y2", y2);
    }
});

nodal.view.GraphView = move.Object({
    verticesEl: null,
    verticesViews: [],
    verticesIds: {},
    linksEl: null,
    linksViews: [],
    layout: null,

    constructor: function(elId) {
        var el = document.getElementById(elId);

        this.verticesEl = document.createElement("div");
        this.verticesEl.id = elId + "-vertices";
        this.verticesEl.className = "vertices";

        var linksElLayer = document.createElement("div");
        linksElLayer.id = elId + "-links";
        linksElLayer.className = "links";
        this.linksEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
       
        linksElLayer.appendChild(this.linksEl);
        el.appendChild(linksElLayer);
        el.appendChild(this.verticesEl);
    },

    addEdge: function(edgeView) {
        this.linksViews.push(edgeView);
        this.linksEl.appendChild(edgeView.el);
    },

    addVertex: function(vertexView) {
        this.verticesViews.push(vertexView);
        this.verticesEl.appendChild(vertexView.el);

        vertexView.bind("drag", (function(event) {
            var v = event.vertex;
            this.linksViews.forEach(function(linkView) {
                if (linkView.src == v || linkView.dst == v) {
                    var x1 = $(linkView.srcAnchorEl).offset().left + 12 - $("#nodal-editor").offset().left,
                        y1 = $(linkView.srcAnchorEl).offset().top + 12 - $("#nodal-editor").offset().top,
                        x2 = $(linkView.dstAnchorEl).offset().left + 12 - $("#nodal-editor").offset().left,
                        y2 = $(linkView.dstAnchorEl).offset().top + 12 - $("#nodal-editor").offset().top;
                    
                    linkView.render(x1, y1, x2, y2);
                }
            }, this);
        }).bind(this));

        vertexView.bind("anchor-drag", (function(event) {
            if (!this.anchorDragEdgeEl) {
                var svgns = "http://www.w3.org/2000/svg";
                var shape = document.createElementNS(svgns, "line");
                this.anchorDragEdgeEl = shape;
                this.linksEl.appendChild(shape);
            }

            var srcAnchorEl = $(event.srcAnchorEl),
                x1 = srcAnchorEl.offset().left + 12,
                y1 = srcAnchorEl.offset().top + 12,
                x2 = event.mouseEvent.clientX + window.scrollX,
                y2 = event.mouseEvent.clientY + window.scrollY;

            this.anchorDragEdgeEl.setAttributeNS(null, "x1", x1);
            this.anchorDragEdgeEl.setAttributeNS(null, "y1", y1);
            this.anchorDragEdgeEl.setAttributeNS(null, "x2", x2);
            this.anchorDragEdgeEl.setAttributeNS(null, "y2", y2);
            this.anchorDragEdgeEl.setAttributeNS(null, "stroke", "black");
            this.anchorDragEdgeEl.setAttributeNS(null, "stroke-width", "5");
        }).bind(this));

        vertexView.bind("end-anchor-drag", (function(event) {
            var dstAnchorEl = null;

            this.linksEl.removeChild(this.anchorDragEdgeEl);
            this.anchorDragEdgeEl = null;

            if (event.dstEl.classList.contains("button")) {
                dstAnchorEl = event.dstEl.parentNode;
                dstVertexId = dstAnchorEl.getAttribute("data-vertexId");
                this.trigger("add-edge", {
                    srcVertexId: event.vertex.el.getAttribute("data-vertexId"),
                    srcVertexAnchorId: event.srcAnchorEl.getAttribute("data-anchorId"),
                    dstVertexId: dstAnchorEl.getAttribute("data-vertexId"),
                    dstVertexAnchorId: dstAnchorEl.getAttribute("data-anchorId")
                });
            }
        }).bind(this));
    },
    
    updateLayout: function() {
        if (this.layout) {
            this.layout.update(this.verticesViews, this.linksViews);
        }
    },

    renderEdge: function(e) {
        var srcView = this.verticesIds[e.inV._id],
            dstView = this.verticesIds[e.outV._id]
            srcAnchorEl = srcView.outEl[e.outVIndex],
            dstAnchorEl = dstView.inEl[e.inVIndex];

        var el = new nodal.view.LinkView(srcView, srcAnchorEl, dstView, dstAnchorEl);
        this.addEdge(el);

        var vertexModelChangeHandler = function(event) {
            if (e.inV.evaluate != null) {
                var ret = e.inV.evaluate(srcView);
            }

            e.outV.inSockets[e.inVIndex].data = event.vertex.outSockets[e.outVIndex].data;
            
            dstView.trigger("node-output-data-change", {
                outputId: e.inVIndex,
                data: {},
                vertex: dstView.model 
            });

        };

        srcView.bind("node-output-data-change", vertexModelChangeHandler);
        srcView.bind("node-prop-change", vertexModelChangeHandler);
    },

    renderVertex: function(v) {
        var el = new nodal.view.VertexView(v, v.props._type, v.props.inputs, v.props.outputs);
        this.verticesIds[v._id] = el;
        this.addVertex(el);
    },

    render: function(graph) {
        var g = graph;
        
        g.v.all.forEach(function(v) {
            this.renderVertex(v);
        }, this);

        this.updateLayout();
        
        g.e.all.forEach(function(e) {
            this.renderEdge(e);
        }, this);
    }
});

nodal.layout.Random = move.Object({
    constructor: function() {
    },

    update: function(vertices) {
        vertices.forEach(function(vertex) {
            vertex.el.style.left = Math.random() * window.innerWidth + "px";
            vertex.el.style.top = Math.random() * window.innerHeight + "px";
        });
    }
});

nodal.layout.Grid = move.Object({
    constructor: function() {

    },

    update: function(vertices) {
        var startLeft = 0,
            startTop = 0,
            padX = 40,
            padY = 40,
            lineMaxHeight = 0;

        vertices.forEach(function(vertex) {
            vertex.el.style.left = startLeft + "px";
            vertex.el.style.top = startTop + "px";
        
            if (vertex.el.offsetHeight > lineMaxHeight) {
                lineMaxHeight += vertex.el.offsetHeight;
            }

            startLeft += (parseInt(vertex.el.offsetWidth, 10) + padX);

            if (startLeft > (window.innerWidth - parseInt(vertex.el.offsetHeight, 10))) {
                startLeft = 0;
                startTop += (parseInt(vertex.el.offsetHeight, 10) + padY);
                lineMaxHeight = 0;
            }
        });
    }
});

}(typeof exports === 'object' && exports || this));
