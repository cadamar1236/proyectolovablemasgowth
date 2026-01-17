# Script para probar emails ASTAR por día
# Ejecuta: .\test-emails.ps1 -day lunes

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('lunes','martes','miercoles','jueves','viernes','sabado','domingo','todos')]
    [string]$day = 'lunes'
)

$baseUrl = "https://astarlabshub.com/api/astar-messages/cron/send-by-day"

function Send-DayEmail {
    param([string]$dayName)
    
    Write-Host "`n📧 Enviando email de $dayName..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$dayName" -Method Post -ContentType "application/json"
        
        Write-Host "✅ Email enviado exitosamente!" -ForegroundColor Green
        Write-Host "   Usuario: $($response.user)" -ForegroundColor Gray
        Write-Host "   Templates: $($response.totalTemplates)" -ForegroundColor Gray
        Write-Host "   Enviados: $($response.sent)" -ForegroundColor Green
        
        if ($response.results) {
            Write-Host "`n   Resultados:" -ForegroundColor Yellow
            foreach ($result in $response.results) {
                if ($result.success) {
                    Write-Host "   ✓ $($result.subject) - $($result.category)" -ForegroundColor Green
                } else {
                    Write-Host "   ✗ $($result.subject) - Error: $($result.error)" -ForegroundColor Red
                }
            }
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Error enviando email: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

if ($day -eq 'todos') {
    Write-Host "`n🚀 Enviando TODOS los emails de la semana...`n" -ForegroundColor Magenta
    
    $dias = @('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
    foreach ($dia in $dias) {
        Send-DayEmail -dayName $dia
        Start-Sleep -Seconds 2
    }
    
    Write-Host "`n✨ Proceso completado!" -ForegroundColor Magenta
} else {
    Send-DayEmail -dayName $day
}

Write-Host "`n📬 Revisa tu email: aihelpstudy@gmail.com`n" -ForegroundColor Cyan
