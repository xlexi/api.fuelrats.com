module.exports = {
  build: {
    cwd: '.',
    src: [ 'docs/index.apib' ],
    dest: 'test/',
    flatten: true,
    options: {
      includeRegexp: /<!-- include\(([^'"]+)\) -->/,
      banner: '<!-- This file is automatically generated and should not be modified -->\n'
    }
  }
}
