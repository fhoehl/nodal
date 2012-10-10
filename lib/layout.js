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
