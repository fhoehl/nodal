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
