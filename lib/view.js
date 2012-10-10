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
        console.log(event.target, event.currentTarget, event.target.parentNode);
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
        
        this.el.style.left = (this.elStartLeft + x - this.cursorStartX) + "px";
        this.el.style.top = (this.elStartTop + y - this.cursorStartY) + "px";
        
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
                    var x1 = $(linkView.srcAnchorEl).offset().left + 12,
                        y1 = $(linkView.srcAnchorEl).offset().top + 12,
                        x2 = $(linkView.dstAnchorEl).offset().left + 12,
                        y2 = $(linkView.dstAnchorEl).offset().top + 12;

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
