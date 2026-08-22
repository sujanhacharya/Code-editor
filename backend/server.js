const http = require('http');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

var PORT = 3001;
var TIMEOUT_MS = 10000;
var MAX_OUTPUT = 65536;

// Used to turn a fatal signal into a conventional 128+signum exit code and a
// plain-English explanation, so a crash is never mistaken for a clean run.
var SIGNAL_NUMBERS = {
  SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGILL: 4, SIGABRT: 6, SIGFPE: 8,
  SIGKILL: 9, SIGBUS: 10, SIGSEGV: 11, SIGPIPE: 13, SIGTERM: 15,
};

var SIGNAL_MEANINGS = {
  SIGSEGV: 'segmentation fault - invalid memory access',
  SIGABRT: 'aborted - uncaught exception or assertion failure',
  SIGFPE: 'arithmetic error - e.g. integer division by zero',
  SIGBUS: 'bus error - misaligned or invalid memory access',
  SIGILL: 'illegal instruction',
  SIGKILL: 'killed',
  SIGTERM: 'terminated',
};

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
    // Guarantees at most one response per request. Node can emit both 'error'
    // and 'close' on a child process, and a double jsonResponse would throw
    // ERR_HTTP_HEADERS_SENT and take the whole server down.
    var responded = false;
    function respond(data) {
      if (responded) return;
      responded = true;
      jsonResponse(res, data);
    }

    var chunks = [];
    req.on('data', function (chunk) { chunks.push(chunk); });
    req.on('end', function () {
      var body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch (e) {
        return respond({ stdout: '', stderr: 'Invalid request body.', exitCode: 1, executionTime: 0, phase: 'network_error' });
      }

      var code = body.code || '';
      var stdin = body.stdin || '';

      if (!code || typeof code !== 'string') {
        return respond({ stdout: '', stderr: 'No source code provided.', exitCode: 1, executionTime: 0, phase: 'network_error' });
      }

      var tmpDir;
      try {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codelab-'));
      } catch (e) {
        return respond({ stdout: '', stderr: 'Server could not create a temp directory: ' + e.message, exitCode: 1, executionTime: 0, phase: 'network_error' });
      }

      var srcFile = path.join(tmpDir, 'main.cpp');
      var exeFile = path.join(tmpDir, 'main');
      var t0 = Date.now();

      try {
        fs.writeFileSync(srcFile, code, 'utf-8');
      } catch (e) {
        safeRemove(tmpDir);
        return respond({ stdout: '', stderr: 'Server could not write the source file: ' + e.message, exitCode: 1, executionTime: 0, phase: 'network_error' });
      }

      // Compile with g++
      execFile('g++', ['-o', exeFile, srcFile, '-std=c++17', '-O2'], { timeout: TIMEOUT_MS }, function (cErr, cOut, cErr2) {
        var elapsed = Date.now() - t0;

        if (cErr) {
          safeRemove(tmpDir);

          // A missing toolchain or a compiler that itself timed out is NOT the
          // user's code being wrong - say so instead of blaming their source.
          if (cErr.code === 'ENOENT') {
            return respond({
              stdout: '',
              stderr: 'COMPILER NOT FOUND\n\ng++ is not installed or not on PATH on the machine running the backend.',
              exitCode: 1,
              executionTime: elapsed,
              phase: 'network_error',
            });
          }
          if (cErr.killed || cErr.signal) {
            return respond({
              stdout: '',
              stderr: (cErr2 ? cErr2 + '\n\n' : '') +
                'Compilation timed out after ' + (TIMEOUT_MS / 1000) + 's.',
              exitCode: 124,
              executionTime: elapsed,
              phase: 'timeout',
            });
          }

          // Genuine compiler diagnostics: passed through verbatim.
          return respond({
            stdout: '',
            stderr: cErr2 || cErr.message || 'Compilation failed',
            exitCode: 1,
            executionTime: elapsed,
            phase: 'compile_error',
          });
        }

        // Execute compiled binary
        var proc;
        try {
          proc = spawn(exeFile, [], { cwd: tmpDir, timeout: TIMEOUT_MS });
        } catch (e) {
          safeRemove(tmpDir);
          return respond({
            stdout: '',
            stderr: 'Failed to start process: ' + e.message,
            exitCode: 1,
            executionTime: Date.now() - t0,
            phase: 'network_error',
          });
        }

        var stdout = '';
        var stderr = '';
        // Distinguishes "we killed it for exceeding the output cap" from
        // "spawn's own timeout killed it", so a chatty program is not
        // mislabelled as a timeout.
        var truncated = false;

        // Byte-accurate accumulation. Concatenating d.toString() per chunk can
        // split a multi-byte UTF-8 character across chunk boundaries, and
        // slicing a JS string after measuring BYTES cuts in the wrong place.
        var outChunks = [];
        var outBytes = 0;
        var errChunks = [];
        var errBytes = 0;

        proc.stdout.on('data', function (d) {
          // Already full and MORE is arriving, so output is genuinely being
          // lost - flag it. (Reaching the cap exactly and then ending is not
          // truncation, and must not claim to be.) Pipe chunks are commonly
          // exactly 64KB, so this branch is the normal path, not an edge case.
          if (outBytes >= MAX_OUTPUT) {
            truncated = true;
            try { proc.kill('SIGKILL'); } catch (e) {}
            return;
          }
          if (outBytes + d.length > MAX_OUTPUT) {
            outChunks.push(d.slice(0, MAX_OUTPUT - outBytes));
            outBytes = MAX_OUTPUT;
            truncated = true;
            try { proc.kill('SIGKILL'); } catch (e) {}
            return;
          }
          outChunks.push(d);
          outBytes += d.length;
        });

        proc.stderr.on('data', function (d) {
          if (errBytes >= MAX_OUTPUT) {
            truncated = true;
            try { proc.kill('SIGKILL'); } catch (e) {}
            return;
          }
          if (errBytes + d.length > MAX_OUTPUT) {
            errChunks.push(d.slice(0, MAX_OUTPUT - errBytes));
            errBytes = MAX_OUTPUT;
            truncated = true;
            try { proc.kill('SIGKILL'); } catch (e) {}
            return;
          }
          errChunks.push(d);
          errBytes += d.length;
        });

        // A program that never reads stdin closes its input pipe early, so this
        // write fails with EPIPE. Without a listener that becomes an unhandled
        // 'error' event and kills the ENTIRE backend - after which every later
        // run would be misreported to the user as a network failure. Swallowing
        // it is correct: the program simply chose not to read its input.
        proc.stdin.on('error', function () {});

        try {
          if (stdin) {
            proc.stdin.write(stdin);
          }
          proc.stdin.end();
        } catch (e) {
          // Pipe already gone; nothing to do.
        }

        proc.on('close', function (exitCode, signal) {
          var totalElapsed = Date.now() - t0;
          // Defer cleanup so response sends first
          setTimeout(function () { safeRemove(tmpDir); }, 500);

          stdout = Buffer.concat(outChunks).toString('utf-8');
          stderr = Buffer.concat(errChunks).toString('utf-8');

          // spawn({timeout}) kills with a signal when the program runs too long.
          var timedOut = !truncated && (signal === 'SIGTERM' || signal === 'SIGKILL');

          // A program killed by a signal (segfault, abort, divide-by-zero)
          // reports exitCode === null. Left as 0 it would look like a clean
          // success, so translate it into the conventional 128+signum code and
          // say plainly what happened.
          var crashed = !timedOut && !truncated && exitCode == null && !!signal;

          var reportedExit;
          if (timedOut) {
            reportedExit = 124;
          } else if (truncated) {
            // We killed it, so its exit status is meaningless. The program
            // produced valid output right up to the cap.
            reportedExit = 0;
          } else if (exitCode != null) {
            reportedExit = exitCode;
          } else if (signal) {
            reportedExit = 128 + (SIGNAL_NUMBERS[signal] || 0);
          } else {
            reportedExit = 0;
          }

          var phase;
          if (timedOut) {
            phase = 'timeout';
          } else if (truncated) {
            phase = 'success';
          } else if (crashed) {
            phase = 'runtime_error';
          } else if (reportedExit === 0) {
            phase = 'success';
          } else {
            phase = 'runtime_error';
          }

          var outText = stdout;
          if (truncated) {
            outText += '\n\n[output truncated at ' + MAX_OUTPUT + ' bytes - the program was stopped here]';
          }

          var errText = stderr;
          if (timedOut) {
            errText = (stderr ? stderr + '\n\n' : '') +
              'Execution timed out after ' + (TIMEOUT_MS / 1000) + 's (possible infinite loop).';
          } else if (crashed) {
            errText = (stderr ? stderr + '\n\n' : '') +
              'Program terminated by signal ' + signal +
              (SIGNAL_MEANINGS[signal] ? ' (' + SIGNAL_MEANINGS[signal] + ')' : '') + '.';
          }

          respond({
            stdout: outText,
            stderr: errText,
            exitCode: reportedExit,
            executionTime: totalElapsed,
            phase: phase,
          });
        });

        proc.on('error', function (e) {
          var totalElapsed = Date.now() - t0;
          setTimeout(function () { safeRemove(tmpDir); }, 500);
          // The process could not be started/managed at all - that is a server
          // fault, not the user's program failing at runtime.
          respond({
            stdout: '',
            stderr: 'EXECUTION FAILED\n\nThe backend could not run the compiled program: ' + e.message,
            exitCode: 1,
            executionTime: totalElapsed,
            phase: 'network_error',
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

// Last-resort safety net. A dead backend is indistinguishable from a network
// outage in the UI, so it is far better to log a stray error and keep serving
// than to exit and have every later run reported as "service unavailable".
process.on('uncaughtException', function (e) {
  console.error('[codelab] uncaught exception (server kept alive):', e && e.stack ? e.stack : e);
});

process.on('unhandledRejection', function (e) {
  console.error('[codelab] unhandled rejection (server kept alive):', e);
});
