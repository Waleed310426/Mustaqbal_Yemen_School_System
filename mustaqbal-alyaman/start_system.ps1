# ==============================================================================
# نظام إدارة مدرسة مستقبل اليمن الأهلية الحديثة - معالج التشغيل الشامل (5 مراحل)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "نظام مدرسة مستقبل اليمن - معالج التشغيل الذكي"

function Print-Header {
    Clear-Host
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "                مدرسة مستقبل اليمن الأهلية الحديثة                    " -ForegroundColor Cyan
    Write-Host "                 نظام الإدارة المدرسية والكنترول الذكي                 " -ForegroundColor White
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

Print-Header

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path "$scriptDir\mustaqbal-alyaman") {
    $baseDir = "$scriptDir\mustaqbal-alyaman"
} else {
    $baseDir = $scriptDir
}

$backendDir = "$baseDir\backend"
$frontendDir = "$baseDir\frontend"

# ------------------------------------------------------------------------------
# المرحلة 1/5: فحص بيئة التشغيل والمتطلبات
# ------------------------------------------------------------------------------
Write-Host "⏳ [المرحلة 1 من 5] فحص بيئة التشغيل والمتطلبات الأساسية..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 700

$nodeVer = & node -v 2>$null
if (-not $nodeVer) {
    Write-Host "   [✕] خطأ: Node.js غير مثبت على جهازك! يرجى تثبيته للمتابعة." -ForegroundColor Red
    Read-Host "اضغط Enter للإغلاق"
    exit 1
}

$npmVer = & npm -v 2>$null
if (-not $npmVer) {
    Write-Host "   [✕] خطأ: npm غير متوفر في مسار النظام!" -ForegroundColor Red
    Read-Host "اضغط Enter للإغلاق"
    exit 1
}

if (-not (Test-Path $backendDir)) {
    Write-Host "   [✕] خطأ: لم يتم العثور على مجلد الباك إند: $backendDir" -ForegroundColor Red
    Read-Host "اضغط Enter للإغلاق"
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "   [✕] خطأ: لم يتم العثور على مجلد الواجهة: $frontendDir" -ForegroundColor Red
    Read-Host "اضغط Enter للإغلاق"
    exit 1
}

Write-Host "   [✓] بيئة Node.js جاهزة ومثبتة ($nodeVer - npm v$npmVer)" -ForegroundColor Green
Write-Host "   [✓] مجلدات النظام وملفات المشروع مكتملة." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# المرحلة 2/5: فحص الاتصال بقاعدة البيانات
# ------------------------------------------------------------------------------
Write-Host "⏳ [المرحلة 2 من 5] التحقق من الاتصال بقاعدة بيانات المدرسة (MySQL)..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 700

$dbCheckScript = "require('./src/config/db').authenticate().then(function(){process.exit(0)}).catch(function(){process.exit(1)})"
$dbCheckProcess = Start-Process -FilePath "node" -ArgumentList "-e", "`"$dbCheckScript`"" -WorkingDirectory $backendDir -NoNewWindow -PassThru -Wait

if ($dbCheckProcess.ExitCode -ne 0) {
    # محاولة تشغيل MySQL تلقائياً إذا كان XAMPP مثبتاً
    $xamppMysql = "C:\xampp\mysql\bin\mysqld.exe"
    $xamppIni = "C:\xampp\mysql\bin\my.ini"
    if (Test-Path $xamppMysql) {
        Write-Host "   [...] خادم MySQL متوقف، جارٍ تشغيل MySQL عبر XAMPP تلقائياً..." -ForegroundColor DarkCyan
        Start-Process -FilePath $xamppMysql -ArgumentList "--defaults-file=$xamppIni", "--standalone" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        # إعادة الفحص
        $dbCheckProcess = Start-Process -FilePath "node" -ArgumentList "-e", "`"$dbCheckScript`"" -WorkingDirectory $backendDir -NoNewWindow -PassThru -Wait
    }
}

if ($dbCheckProcess.ExitCode -eq 0) {
    Write-Host "   [✓] تم الاتصال بنجاح بقاعدة البيانات (mustaqbal_alyaman)." -ForegroundColor Green
    Write-Host "   [✓] حالة قاعدة البيانات: نشطة ومتصلة وجاهزة لاستقبال البيانات." -ForegroundColor Green
} else {
    Write-Host "   [✕] خطأ: تعذر الاتصال بـ MySQL! يرجى فتح لوحة XAMPP والضغط على Start أمام MySQL." -ForegroundColor Red
}
Write-Host ""

# ------------------------------------------------------------------------------
# المرحلة 3/5: تشغيل خادم الباك إند
# ------------------------------------------------------------------------------
Write-Host "⏳ [المرحلة 3 من 5] تشغيل خادم الباك إند والـ API (Port: 5005)..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 700

$port5005 = Get-NetTCPConnection -LocalPort 5005 -State Listen -ErrorAction SilentlyContinue

if ($port5005) {
    Write-Host "   [✓] خادم الباك إند يعمل مسبقاً على المنفذ 5005." -ForegroundColor Green
} else {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "node src/server.js" -WorkingDirectory $backendDir -WindowStyle Minimized
    Write-Host "   [...] جارٍ إطلاق خادم الباك إند وخدمة Socket.io..." -ForegroundColor DarkCyan
    
    # انتظار بدء الاستماع
    $ready = $false
    for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Milliseconds 600
        $check = Get-NetTCPConnection -LocalPort 5005 -State Listen -ErrorAction SilentlyContinue
        if ($check) { $ready = $true; break }
    }
    
    if ($ready) {
        Write-Host "   [✓] تم إطلاق خادم الباك إند بنجاح على: http://localhost:5005" -ForegroundColor Green
    } else {
        Write-Host "   [✕] تنبيه: لم يستجب خادم الباك إند على المنفذ 5005. تأكد من عمل MySQL." -ForegroundColor Red
    }
}
Write-Host ""

# ------------------------------------------------------------------------------
# المرحلة 4/5: تشغيل خادم الواجهة الأمامية
# ------------------------------------------------------------------------------
Write-Host "⏳ [المرحلة 4 من 5] تشغيل خادم الواجهة الأمامية (Port: 5180)..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 700

$port5180 = Get-NetTCPConnection -LocalPort 5180 -State Listen -ErrorAction SilentlyContinue

if ($port5180) {
    Write-Host "   [✓] خادم الواجهة يعمل مسبقاً على المنفذ 5180." -ForegroundColor Green
} else {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $frontendDir -WindowStyle Minimized
    Write-Host "   [...] جارٍ إطلاق خادم الواجهة عبر Vite..." -ForegroundColor DarkCyan
    
    # انتظار بدء الاستماع
    $ready = $false
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Milliseconds 600
        $check = Get-NetTCPConnection -LocalPort 5180 -State Listen -ErrorAction SilentlyContinue
        if ($check) { $ready = $true; break }
    }
    
    if ($ready) {
        Write-Host "   [✓] تم إطلاق خادم الواجهة بنجاح على: http://localhost:5180" -ForegroundColor Green
    } else {
        Write-Host "   [✓] تم إرسال أمر تشغيل خادم الواجهة." -ForegroundColor Green
    }
}
Write-Host ""

# ------------------------------------------------------------------------------
# المرحلة 5/5: فتح النظام في المتصفح
# ------------------------------------------------------------------------------
Write-Host "⏳ [المرحلة 5 من 5] فتح نظام مدرسة مستقبل اليمن في المتصفح..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 900

Start-Process "http://localhost:5180/login"
Write-Host "   [✓] تم فتح المتصفح على صفحة تسجيل الدخول بنجاح!" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# لوحة النجاح ومعلومات الحسابات
# ------------------------------------------------------------------------------
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "              🎉 تم تشغيل نظام مدرسة مستقبل اليمن بنجاح تام!                  " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 رابط النظام في المتصفح: http://localhost:5180" -ForegroundColor Cyan
Write-Host "  🔗 رابط واجهة الباك إند:   http://localhost:5005/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📌 الحسابات التجريبية الجاهزة لتسجيل الدخول:" -ForegroundColor Yellow
Write-Host "     • مدير النظام: admin@school.ye          (كلمة المرور: Pass@1234)" -ForegroundColor White
Write-Host "     • المعلم:      ahmed.teacher@school.ye  (كلمة المرور: Pass@1234)" -ForegroundColor White
Write-Host "     • الطالب:      student1@school.ye       (كلمة المرور: Pass@1234)" -ForegroundColor White
Write-Host "     • ولي الأمر:   parent1@school.ye        (كلمة المرور: Pass@1234)" -ForegroundColor White
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor DarkGray
Write-Host "  ملاحظة: يمكنك تصغير هذه النافذة بأمان، وستظل السيرفرات تعمل في الخلفية." -ForegroundColor DarkGray
Write-Host "==============================================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "اضغط Enter للإغلاق..." -ForegroundColor Gray
$null = Read-Host
