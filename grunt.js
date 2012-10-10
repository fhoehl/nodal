module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      dist: {
        src: [
            '<banner:meta.banner>', '<file_strip_banner:lib/start.js>', 'lib/main.js',
            'lib/move.js', 'lib/loader.js', 'lib/graph.js',
            'lib/view.js', 'lib/layout.js',
            'lib/end.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    copy: {
      dist: {
        files: {
            'demos/js/': 'dist/<%= pkg.name %>.js',
            'demos/css/': 'dist/<%= pkg.name %>.css'
        }
      }
    },
    less: {
      development: {
        files: {
            'dist/<%= pkg.name %>.css': 'lib/css/*.less'
        }
      },
      production: {
        options: {
            compress: true
        },
        files: {
            'dist/<%= pkg.name %>.min.css': 'lib/css/*.less'
        }
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    test: {
      files: ['test/**/*.js']
    },
    lint: {
      files: ['dist/<%= pkg.name %>.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true
      },
      globals: {
        exports: true,
        module: false
      }
    },
    uglify: {}
  });

  // Default task.
  grunt.loadNpmTasks('grunt-contrib');
  grunt.registerTask('default', 'concat min less copy');
};
