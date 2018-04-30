const gulp = require('gulp')
const _$ = require('gulp-load-plugins')()
const runs = require('run-sequence')
const ts = _$.typescript.createProject('tsconfig.json')
const packager = require('electron-packager')
const manifest = require('./src/package.json')
let winInstall, debInstall
if (process.platform === 'win32') {
  winInstall = require('electron-windows-installer')
}
if (process.platform === 'linux') {
  debInstall = require('electron-installer-debian')
}

const config = {
  origin: 'src/scripts/',
  out: 'dist/scripts/',
  js: [
    ['browser/', '*.js'],
    ['browser/services/', '*.js'],
    ['browser/webView/', '*.js'],
    ['preload/', '*.js'],
    ['manager/', '*.js'],
    ['/', 'browserWindow.js'],
    ['/', 'init.js']
  ]
}

gulp.task('ts', () => {
  return ts.src()
  .pipe(ts())
  .js.pipe(gulp.dest('src/scripts'))
})

gulp.task('js', ['ts'], () => {
  config.js.forEach((item) => {
    gulp.src(config.origin + item[0] + item[1])
    .pipe(_$.uglify())
    .pipe(gulp.dest(config.out + item[0]))
  })
})

gulp.task('html', () => {
  return gulp.src('src/*.html')
  .pipe(gulp.dest('dist'))
})

gulp.task('node', () => {
  return gulp.src(
    [
      'src/node_modules/**/**/**/*',
      '!src/node_modules/**/README*',
      '!src/node_modules/**/example/**',
      '!src/node_modules/**/test/**'
    ]
  )
  .pipe(gulp.dest('dist/node_modules'))
})

gulp.task('package', () => {
  return gulp.src('src/package.json')
  .pipe(gulp.dest('dist'))
})

gulp.task('cpFiles', () => {
  runs('js', 'html', 'package', 'node')
})

gulp.task('build', (cb) => {
  runs('cpFiles', cb)
})

gulp.task('watch', () => {
  gulp.watch('src/*.html', ['html'])
  gulp.watch('src/scripts/**/**/*.ts', ['build'])
  gulp.watch('src/package.json', ['build'])
})

gulp.task('pack:win32', (done) => {
  return packager({
    dir: './dist',
    arch: 'x64',
    platform: 'win32',
    out: './build',
    overwrite: true,
    asar: false,
    packageManager: 'yarn',
    icon: './icons/win-icon.ico'
  }).then((pathFiles) => console.info(`Create Pack: ${pathFiles[0]}`))
})

gulp.task('dist:win32', ['pack:win32'], (done) => {
  if (process.platform !== 'win32') {
    return false
  }

  winInstall({
    appDirectory: './build/' + manifest.productName + '-win32-x64',
    outputDirectory: './build',
    authors: 'Edgar Vaguencia',
    noMsi: true,
    exe: manifest.productName + '.exe',
    iconUrl: 'https://raw.githubusercontent.com/EdgarVaguencia/WhatsWrap/master/icons/win-icon.ico',
    arch: 'ia32'
  }).then(() => console.info('Windows Success')).catch(done)
})

gulp.task('pack:linux64', (done) => {
  return packager({
    dir: './dist',
    arch: 'x64',
    platform: 'linux',
    out: './build',
    overwrite: true,
    asar: false,
    packageManager: 'yarn',
    icon: './icons/win-icon.png'
  }).then((pathFiles) => console.info(`Create Pack: ${pathFiles[0]}`))
})

gulp.task('dist:linux64', ['pack:linux64'], (done) => {
  if (process.platform !== 'linux') {
    return false
  }

  debInstall({
    productName: manifest.name,
    name: manifest.name,
    genericName: manifest.name,
    bin: manifest.productName,
    src: './build/' + manifest.productName + '-linux-x64/',
    dest: './build/',
    arch: 'amd64',
    categories: ['GNOME', 'GTK', 'Utility', 'Social'],
    icon: './icons/win-icon.png',
    mimeType: ['text/plain'],
    homepage: 'https://github.com/EdgarVaguencia/WhatsWrap'
  }).then(() => console.info('Linux Succeess')).catch(err => { console.error(err, err.stack); process.exit(1) })
})
