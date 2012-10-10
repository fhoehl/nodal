$(function() {
    App.ui.handlers.register();

    var GraphModel = move.Object({
        g: new App.nodal.model.Graph(),
        types: {},

        loadJSON: function(url) {
            $.getJSON(url, (function(doc) {
                this.g = App.nodal.loader.loadJSON(doc);
                this.trigger("dataloaded", {graph: this.g});
            }).bind(this));
        },

        addEdge: function(srcVertexId, srcVertexAnchorId, dstVertexId, dstVertexAnchorId) {
            var srcVertex = this.g.getVertex(srcVertexId),
                dstVertex = this.g.getVertex(dstVertexId),
                srcVertexAnchor = srcVertexAnchorId,
                dstVertexAnchor = dstVertexAnchorId;

            var edge = this.g.addEdge(srcVertex, srcVertexAnchor, dstVertex, dstVertexAnchor);
            this.trigger("addVertex", {edge: edge});
        },

        registerNodeType: function(nodeTypeName, props, fn) {
            this.g.v.all.forEach(function(v) {
                if (v.props._type == nodeTypeName) {
                    v.evaluate = fn;
                }
            }, this);
            this.types[nodeTypeName] = props;
        },
    });

    var renderGraph = function(event) {
        graph.registerNodeType("math-integer", 
            function() {
                return {
                    name: "Integer",
                    className: "math integer",
                    outputs: [{name: "value"}]
                }
            }
        );

        graph.registerNodeType("math-float", 
            function() {
                return {
                    name: "Float",
                    className: "math float",
                    outputs: [{name: "value"}]
                }
            }
        );

        graph.registerNodeType("viewer-text", 
            function() {
                return {
                    name: "Text viewer",
                    className: "viewer",
                    inputs: [{name: "Object"}]
                }
            }
        );

        graph.registerNodeType("math-operator",
            function() {
                return {
                    name: "Operator",
                    className: "math operator",
                    inputs: [{name: "Number"}, {name: "Number"}],
                    outputs: [{name: "Number"}]
                }
            },
            function(view) {
                var operator = view.model.props.operatorType,
                    valueA = Number(view.model.inSockets[0].data),
                    valueB = Number(view.model.inSockets[1].data),
                    result = 0;

                switch (operator) {
                    case "add":
                        result = valueA + valueB;
                        break;
                    case "subtract":
                        result = valueA - valueB;
                        break;
                    case "divide":
                        result = valueA / valueB;
                        break;
                    case "multiply":
                        result = valueA * valueB;
                        break;
                };

                view.model.outSockets[0].data = result;
                
                return {  
                    outputId: 0,
                    data: result,
                    node: event.model
                };
            }
        );

        App.editor.render(event.graph);

        $(".dropdown-menu").bind("click a", function(event) {
            var vertexType = event.target.getAttribute("data-action");
            d = graph.types[vertexType]();
            var v = graph.g.v.add(vertexType, d);
            App.editor.renderVertex(v);
            event.preventDefault();
        });

    };

    var renderVertex = function(event) {
    };

    var renderEdge = function(event) {
        App.editor.renderEdge(event.edge);
    };
    
    App.editor = new App.nodal.view.GraphView("nodal-editor");
    App.editor.layout = new App.nodal.layout.Grid;

    graph = new GraphModel();
    graph.bind("dataloaded", renderGraph);
    graph.bind("addVertex", renderEdge);
    graph.loadJSON("graph-example.json");
    
    App.editor.bind("add-edge", (function(event) {
        graph.addEdge(event.srcVertexId, event.srcVertexAnchorId, event.dstVertexId, event.dstVertexAnchorId);
    }).bind(this));

    App.editor.bind("add-vertex", (function(event) {
        graph.addVertex(event.vertex);
    }).bind(this));

});

App.ui.handlers = {};
App.ui.handlers.documentMouseDownMoveHandler = function(event) {
    var ux = event.clientX,
        uy = event.clientY,
        deltaX = - App.ui.originX + ux,
        deltaY = - App.ui.originY + uy,
        canvasEl = document.getElementById("nodal-editor"),
        mX = parseFloat(canvasEl.style.width, 10),
        nX= Math.max(100, (mX + deltaX / canvasEl.offsetWidth)),
        mY = parseFloat(canvasEl.style.height, 10),
        nY = Math.max(100, (mY + deltaY / canvasEl.offsetHeight));

    console.log(mY, deltaY, canvasEl.offsetHeight);

    canvasEl.style.width = nX + "%";
    canvasEl.style.height = nY + "%";

    window.scroll(window.scrollX + deltaX, window.scrollY + deltaY);
};

App.ui.handlers.documentMouseDownHandler = function(event) {
    console.log(event.target, event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
    event.target.style.cursor = "move";
    document.addEventListener("mouseup", App.ui.handlers.documentMouseUpHandler, false);
    App.ui.originX = event.clientX;
    App.ui.originY = event.clientY;
    App.ui.targetEl.addEventListener("mousemove", App.ui.handlers.documentMouseDownMoveHandler, true);
};

App.ui.handlers.documentMouseUpHandler = function(event) {
    event.preventDefault();
    event.target.style.cursor = "default";
    App.ui.targetEl.removeEventListener("mousemove", App.ui.handlers.documentMouseDownMoveHandler, true);
    document.removeEventListener("mouseup", App.ui.handlers.documentMouseUpHandler, false);
};

App.ui.handlers.register = function() {
    var targetEl = document.getElementById("nodal-editor");
    App.ui.targetEl = targetEl;

    var resizeHandler = function(event) {
        targetEl.style.width = window.innerWidth - $(targetEl).offset().left + "px";
        targetEl.style.height = window.innerHeight - $(targetEl).offset().top + "px";
    }

    window.addEventListener("resize", resizeHandler, false);
    resizeHandler();

    //targetEl.addEventListener("mousedown", App.ui.handlers.documentMouseDownHandler, true);
};

