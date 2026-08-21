const http = require('http');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

var PORT = 3001;
var TIMEOUT_MS = 10000;
var MAX_OUTPUT = 65536;

function safeRemove(dir) {
  try {
    var items = fs.readdirSync(dir);
    for (var i = 0; i < items.length; i++) {
      try { fs.unlinkSync(path.join(dir, items[i])); } catch (e) {}
    }
    try { fs.rmdirSync(dir); } catch (e) {}
  } catch (e) {}
}

function jsonResponse(res, data) {
  var body = JSON.stringify(data);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

var server = http.createServer(function (req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  var url = req.url.split('?')[0];

  // Health check
  if (url === '/api/health' && req.method === 'GET') {
    return jsonResponse(res, { status: 'ok' });
  }

  // Execute
  if (url === '/api/execute' && req.method === 'POST') {
    var chunks = [];
    req.on('data', function (chunk) { chunks.push(chunk); });
    req.on('end', function () {
      var body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch (e) {
        return jsonResponse(res, { stdout: '', stderr: 'Invalid request body.', exitCode: 1, executionTime: 0 });
      }

      var code = body.code || '';
      var stdin = body.stdin || '';

      if (!code || typeof code !== 'string') {
        return jsonResponse(res, { stdout: '', stderr: 'No source code provided.', exitCode: 1, executionTime: 0 });
      }

      var tmpDir;
      try {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codelab-'));
      } catch (e) {
        return jsonResponse(res, { stdout: '', stderr: 'Could not create temp directory.', exitCode: 1, executionTime: 0 });
      }

      var srcFile = path.join(tmpDir, 'main.cpp');
      var exeFile = path.join(tmpDir, 'main');
      var t0 = Date.now();

      try {
        fs.writeFileSync(srcFile, code, 'utf-8');
      } catch (e) {
        safeRemove(tmpDir);
        return jsonResponse(res, { stdout: '', stderr: 'Could not write source file.', exitCode: 1, executionTime: 0 });
      }

      // Compile with g++
      execFile('g++', ['-o', exeFile, srcFile, '-std=c++17', '-O2'], { timeout: TIMEOUT_MS }, function (cErr, cOut, cErr2) {
        var elapsed = Date.now() - t0;

        if (cErr) {
          safeRemove(tmpDir);
          return jsonResponse(res, {
            stdout: '',
            stderr: cErr2 || cErr.message || 'Compilation failed',
            exitCode: 1,
            executionTime: elapsed,
          });
        }

        // Execute compiled binary
        var proc;
        try {
          proc = spawn(exeFile, [], { cwd: tmpDir, timeout: TIMEOUT_MS });
        } catch (e) {
          safeRemove(tmpDir);
          return jsonResponse(res, {
            stdout: '',
            stderr: 'Failed to start process: ' + e.message,
            exitCode: 1,
            executionTime: Date.now() - t0,
          });
        }

        var stdout = '';
        var stderr = '';

        proc.stdout.on('data', function (d) {
          stdout += d.toString();
          if (Buffer.byteLength(stdout, 'utf-8') > MAX_OUTPUT) {
            stdout = stdout.substring(0, MAX_OUTPUT);
            try { proc.kill('SIGKILL'); } catch (e) {}
          }
        });

        proc.stderr.on('data', function (d) {
          stderr += d.toString();
          if (Buffer.byteLength(stderr, 'utf-8') > MAX_OUTPUT) {
            stderr = stderr.substring(0, MAX_OUTPUT);
            try { proc.kill('SIGKILL'); } catch (e) {}
          }
        });

        if (stdin) {
          proc.stdin.write(stdin);
        }
        proc.stdin.end();

        proc.on('close', function (exitCode) {
          var totalElapsed = Date.now() - t0;
          // Defer cleanup so response sends first
          setTimeout(function () { safeRemove(tmpDir); }, 500);
          jsonResponse(res, {
            stdout: stdout,
            stderr: stderr,
            exitCode: exitCode != null ? exitCode : 0,
            executionTime: totalElapsed,
          });
        });

        proc.on('error', function (e) {
          var totalElapsed = Date.now() - t0;
          setTimeout(function () { safeRemove(tmpDir); }, 500);
          jsonResponse(res, {
            stdout: '',
            stderr: 'Runtime error: ' + e.message,
            exitCode: 1,
            executionTime: totalElapsed,
          });
        });
      });
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function () {
  console.log('CodeLab backend running on http://localhost:' + PORT);
});
