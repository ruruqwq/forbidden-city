@echo off
chcp 65001 >nul
title 本宫在紫禁城死过108次 - 本地启动器
cd /d "%~dp0"
set PORT=8901

echo.
echo  ============================================
echo   《本宫在紫禁城死过108次》本地启动器
echo  ============================================
echo  正在启动本地网页服务...
echo  请保持此窗口开启，关闭窗口将停止游戏服务。
echo.

where node >nul 2>nul
if %errorlevel%==0 (
    node server.js
    goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
    python -c "import http.server,socketserver,webbrowser; socketserver.TCPServer.allow_reuse_address=True; s=http.server.ThreadingHTTPServer(('127.0.0.1',%PORT%),http.server.SimpleHTTPRequestHandler); print('游戏已启动：http://127.0.0.1:%PORT%',flush=True); webbrowser.open('http://127.0.0.1:%PORT%'); s.serve_forever()"
    goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 -c "import http.server,socketserver,webbrowser; socketserver.TCPServer.allow_reuse_address=True; s=http.server.ThreadingHTTPServer(('127.0.0.1',%PORT%),http.server.SimpleHTTPRequestHandler); print('游戏已启动：http://127.0.0.1:%PORT%',flush=True); webbrowser.open('http://127.0.0.1:%PORT%'); s.serve_forever()"
    goto :eof
)
echo  没有找到 Python 或 Node.js，无法启动本地服务。
echo  请安装 Python（https://www.python.org/downloads/）后重试。
pause
