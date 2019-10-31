var CleanCSS = require('clean-css')
var path = require('path')
var fs = require('fs')
var root = path.join(__dirname)
var UglifyJS = require('uglify-es')

// 压缩css
function clean(data) {
  var options = {
    /* options */
  }
  return new CleanCSS(options).minify(data)
}

// 压缩js
function uglifyjs(data) {
  var res = UglifyJS.minify(data)
  if (res.error) {
    return console.log(res.error)
  }
  return res.code
}

// 同步删除文件夹
function removePromise(dir) {
  return new Promise(function(resolve, reject) {
    //先读文件夹
    fs.stat(dir, function(err, stats) {
      // 如果没有文件夹，就创建mcss
      if (!stats) {
        console.log('There is no ' + dir + ' folder here')
        fs.mkdirSync(path.join(root, dir), 0777)
        console.log('Successfully created the ' + dir + ' folder')
        return
      }
      if (stats.isDirectory()) {
        fs.readdir(dir, function(err, files) {
          if (err) {
            console.log(err)
          }
          files = files.map(file => path.join(dir, file)) // a/b  a/m
          files = files.map(file => removePromise(file)) //这时候变成了promise
          Promise.all(files).then(function() {
            fs.rmdir(dir, resolve)
          })
        })
      } else {
        fs.unlink(dir, resolve)
      }
    })
  })
}

function compress(SourceFolder, OutputFolder) {
  // 成功删除后，需要重新创建文件夹
  removePromise(OutputFolder).then(function() {
    console.log('Successfully deleted the ' + OutputFolder + ' folder')
    fs.mkdirSync(path.join(root, OutputFolder), 0777)
    console.log('Successfully created the ' + OutputFolder + ' folder')
  })
  // TODO: 如果遇到文件夹，需要递归
  fs.readdir(path.join(root, SourceFolder), function(err, files) {
    if (err) {
      return console.log(err)
    }
    var dirs = []
    ;(function iterator(i) {
      if (i === files.length) {
        return
      }

      fs.stat(path.join(path.join(root, SourceFolder), files[i]), function(
        err,
        data
      ) {
        if (data.isFile()) {
          dirs.push(files[i])
          // 读写操作
          fs.readFile(path.join(root, SourceFolder, files[i]), 'utf8', function(
            err,
            fileData
          ) {
            if (err) {
              return console.log('Failed to read file', err)
            }
            // 判断是css文件还是js文件
            if (path.extname(files[i]) === '.css') {
              var mincss = clean(fileData).styles
              fs.writeFile(
                path.join(
                  root,
                  OutputFolder,
                  path.basename(files[i], '.css') + '.min.css'
                ),
                mincss,
                function(err) {
                  if (err) {
                    return console.log('CSS compressed file write failed', err)
                  }
                  console.log('CSS compressed file was successfully written')
                }
              )
            } else if (path.extname(files[i]) === '.js') {
              var minjs = uglifyjs(fileData)
              fs.writeFile(
                path.join(
                  root,
                  OutputFolder,
                  path.basename(files[i], '.js') + '.min.js'
                ),
                minjs,
                function(err) {
                  if (err) {
                    return console.log('js compressed file write failed', err)
                  }
                  console.log('js compressed file was successfully written')
                }
              )
            }
          })
        }
        iterator(i + 1)
      })
    })(0)
  })
}

compress('ocss', 'mcss')
compress('ojs', 'mjs')
