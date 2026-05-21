@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo.
echo  ============================================
echo    نشر موقع الأكاديمية — Cloudflare Pages
echo  ============================================
echo.

set /p SITE_URL="أدخل النطاق الكامل (مثال https://academy.pages.dev): "
if "%SITE_URL%"=="" (
  echo تم الإلغاء — لم يُدخل نطاق.
  pause
  exit /b 1
)

set "NODE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
if not exist "%NODE%" set "NODE=%LOCALAPPDATA%\Programs\Cursor\resources\app\resources\helpers\node.exe"
if not exist "%NODE%" (
  echo لم يُعثر على Node. ثبّت Node أو استخدم لوحة Cloudflare يدوياً.
  pause
  exit /b 1
)

echo.
echo [1/2] تحديث sitemap.xml ...
"%NODE%" scripts\prepare-sitemap.mjs "%SITE_URL%"
if errorlevel 1 pause & exit /b 1

echo.
echo [2/2] تذكير: اضبط siteUrl في supabase-config.js بنفس النطاق
echo        siteUrl: "%SITE_URL%"
echo.
echo  الخطوات في Cloudflare Dashboard:
echo    1. Pages ^> Create project ^> Direct Upload
echo    2. ارفع مجلد المشروع كاملاً (أو اربط GitHub)
echo    3. Build command: فارغ   Build output: .  (الجذر)
echo    4. بعد النشر: Search Console ^> أضف sitemap: %SITE_URL%/sitemap.xml
echo.
echo  أو من الطرفية (بعد npx wrangler login):
echo    npx wrangler pages deploy . --project-name=masariha-academy
echo.
pause
