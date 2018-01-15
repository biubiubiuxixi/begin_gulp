// 加载插件
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer'); // 自动添加css前缀
const postcss = require('gulp-postcss'); // 解析css
const px2rem = require('postcss-px2rem') // 根据一个样式表，生成rem版本和@ 1x，@ 2x和@ 3x样式表。
const csslint = require('gulp-csslint');
const cleanCSS = require('gulp-clean-css');
const rev = require('gulp-rev'); // 文件名加哈希值,把版本号写到rev-manifest.json配置文件里。
const jshint = require('gulp-jshint');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify'); // 压缩js代码
const imagemin = require('gulp-imagemin'); // 压缩图片
const cache = require('gulp-cache');
const revCollector = require('gulp-rev-collector'); // 替换链接
const htmlmin = require('gulp-htmlmin');
// const livereload = require('gulp-livereload');
const notify = require('gulp-notify'); // 更改提醒
const del = require('del');
const browserSync   = require('browser-sync').create();
const reload        = browserSync.reload;
var proxy = require('http-proxy-middleware');

const isProd = process.env.NODE_ENV === 'production';
const dist = isProd ? 'build' : 'dist';

// 建立任务
gulp.task('styles', () => {
    const processors = [px2rem({remUnit: 75})];
    return gulp.src(['src/styles/*.scss', 'src/styles/*.css'])
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(csslint())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(cleanCSS())
        .pipe(concat('style.css'))
        .pipe(rev())
        .pipe(gulp.dest(dist + '/styles'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/styles'));
});

gulp.task('scripts', () =>
    // 在src上，使用!来指定要忽略的文件
    gulp.src(['src/js/*.js', '!src/js/*.min.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default', { verbose: true }))
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(dist + '/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'))
);

// 压缩图片
gulp.task('images', () => 
    gulp.src('src/images/**/*')
        .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
        .pipe(rev())
        .pipe(gulp.dest(dist + '/images'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/images'))
);

gulp.task('rev', () => 
    gulp.src(['rev/**/*.json', 'src/**/*.html'])
        .pipe(revCollector({
            replaceReved: true,
        }))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(dist))
);

// 移动文件
gulp.task('movefile', () =>
    gulp.src('src/js/*.min.js')
        .pipe(gulp.dest(dist + '/js'))
);

// 清除文件
gulp.task('clean', (cb) => {
    del([dist + 'styles', dist + 'js', dist + 'images'], cb);
});

// 监听是否做修改
gulp.task('watch', () =>{ 
    gulp.watch(['src/styles/*.scss', 'src/styles/*.css', 'src/js/*.js', '!src/js/*.min.js', 'src/images/**/*', 'src/*.html'],['clean','dev']);
});

gulp.task('browser', ()=> {
    const middleware = proxy(
        '/proxyText',
        {
            target: 'targeturl',
            changeOrigin: true,
            logLevel: 'debug',
            ws: true,
            secure: false,
        }
    );
    browserSync.init({
        port: 8686,
        https: true,
        open: false,
        server: {
            directory: true,
            baseDir: 'dist/',
        },
        middleware: [middleware],
    });
    gulp.watch(dist + '/*.html').on('change', reload);
});

gulp.task('dev', () => {
    gulp.start(
        ['styles'],
        ['images'],
        ['rev'],
        ['movefile'],
    );
});

gulp.task('default', () => {
    gulp.start(
        ['watch'],
        ['dev'],
        ['browser']
    );
});