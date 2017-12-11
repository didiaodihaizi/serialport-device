module.exports = function (grunt) {
  grunt.initConfig({
    'create-windows-installer': {
      // ia32: {
      //   appDirectory: './dist/win-ia32-unpacked',
      //   outputDirectory: './publish/ia32',
      //   name: 'advanpro-open-tools',
      //   description: 'advanpro-open-tools',
      //   authors: 'Advanpro Ltd',
      //   loadingGif:'./app/icons/loadingGif.gif',
      //   exe: 'advanpro-open-tools.exe',
      //   setupIcon: './app/icons/icon.ico'
      // },
      x64: {
        appDirectory: './dist/win-unpacked',
        outputDirectory: './publish/x64',
        name: 'advanpro-open-tools',
        description: 'advanpro-open-tools',
        authors: 'Advanpro Ltd',
        loadingGif:'./app/icons/loadingGif.gif',
        exe: 'advanpro-open-tools.exe',
        setupIcon: './app/icons/icon.ico'
      },
    },
  });

  grunt.loadNpmTasks('grunt-electron-installer');
  // 设置为默认
  grunt.registerTask('default', ['create-windows-installer']);
};

