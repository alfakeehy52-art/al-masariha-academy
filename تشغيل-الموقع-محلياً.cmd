@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo.
echo  ============================================
echo    تشغيل موقع الأكاديمية محلياً
echo  ============================================
echo.

where python >nul 2>&1
if %errorlevel%==0 (
  echo  تشغيل عبر Python على المنفذ 5500...
  echo  افتح: http://127.0.0.1:5500/index.html
  echo.
  start "" "http://127.0.0.1:5500/index.html"
  python -m http.server 5500
  goto :eof
)

set "NODE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
if not exist "%NODE%" set "NODE=%LOCALAPPDATA%\Programs\Cursor\resources\app\resources\helpers\node.exe"

if exist "%NODE%" (
  echo  Python غير متاح — تشغيل عبر Node على المنفذ 5500...
  echo  افتح: http://127.0.0.1:5500/index.html
  echo.
  start "" "http://127.0.0.1:5500/index.html"
  "%NODE%" -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};http.createServer((q,res)=>{let u=decodeURIComponent((q.url||'/').split('?')[0]);let f=path.join(root,u==='/'?'index.html':u.replace(/^\//,''));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){if(fs.existsSync(f+path.sep+'index.html'))f=path.join(f,'index.html');else f=path.join(root,'index.html');}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(5500,()=>console.log('Serving http://127.0.0.1:5500/'));"
  goto :eof
)

echo  لم يُعثر على Python ولا Node.
echo  ثبّت Python من python.org وفعّل "Add to PATH"
echo  أو استخدم Live Server في Cursor/VS Code.
echo.
pause
