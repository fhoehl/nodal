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
