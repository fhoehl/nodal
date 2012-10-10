nodeed.math = {};
nodeed.math.matrix = {
    zero: function(n, m) {
        var matrix = new Array(n),
            i, j;

        for (i = 0; i < n; i++) {
            matrix[i] = new Array(m);
            for (j = 0; j < m; j++) {
                matrix[i][j] = 0;
            }
        }

        return matrix;
    },

    random: function(n, m) {
        for (i = 0; i < n; i++) {
            matrix[i] = new Array(cols);
            for (j = 0; j < size; j++) {
                matrix[i][j] = Math.random();
            }
        }

        return matrix;
    },

    map: function(matrix, fun) {
        for (i = 0; i < n; i++) {
            for (j = 0; j < size; j++) {
                matrix[i][j] = fun(i, j, matrix[i][j]);
            }
        }
    }
};

