# Genera los iconos de la app desde código (no requiere assets externos).
# Salidas:
#   assets/icon.png           1024x1024  diseño completo (iOS / Android legacy)
#   assets/adaptive-icon.png  1024x1024  solo G centrada (foreground Android adaptive)
#   assets/adaptive-icon-bg.png 1024x1024 fondo gradient (background Android adaptive)
#   assets/splash-icon.png    1024x1024  diseño completo para splash
#
# Diseño:
#  - Squircle con LinearGradient #1C1C24 -> #060609 (vertical)
#  - Sutil highlight radial top-left (warmth)
#  - Anillo interno semitransparente (~10% white) para profundidad
#  - G en Segoe UI Black, blanco con leve degradado vertical hacia gris frio
#  - Drop shadow suave debajo de la G
#  - Centrado por bounds del GraphicsPath (óptica precisa, sin paddings de metrics)

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
    param([float]$x, [float]$y, [float]$w, [float]$h, [float]$r)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Render-FullIcon {
    param([int]$size, [float]$gEmFraction, [string]$outPath)

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # --- Background squircle con gradient lineal limpio ---
    # (Evitamos PathGradientBrush radial: produce banding visible en 1024px)
    $cornerR = [float]($size * 0.225)
    $bgPath = New-RoundedRectPath 0 0 $size $size $cornerR
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $colorTop = [System.Drawing.Color]::FromArgb(255, 32, 32, 42)
    $colorBot = [System.Drawing.Color]::FromArgb(255, 8, 8, 12)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $colorTop, $colorBot, 105.0
    $g.FillPath($bgBrush, $bgPath)

    # --- Hairline interior (apenas perceptible, sólo borde superior visible) ---
    # Da sensación de cristal / chip iOS.
    $strokeColor = [System.Drawing.Color]::FromArgb(22, 255, 255, 255)
    $strokePen = New-Object System.Drawing.Pen $strokeColor, ([float]($size * 0.003))
    $pad = [float]($size * 0.008)
    $innerR = $cornerR - $pad
    $innerPath = New-RoundedRectPath $pad $pad ($size - $pad * 2) ($size - $pad * 2) $innerR
    $g.DrawPath($strokePen, $innerPath)

    # --- "G" como path ---
    $gPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $fontFamily = New-Object System.Drawing.FontFamily "Segoe UI Black"
    $emSize = [float]($size * $gEmFraction)
    $gPath.AddString("G", $fontFamily, ([int][System.Drawing.FontStyle]::Bold), $emSize, (New-Object System.Drawing.PointF 0, 0), [System.Drawing.StringFormat]::GenericTypographic)

    # Centrar por bounds reales
    $bounds = $gPath.GetBounds()
    $tx = ($size - $bounds.Width) / 2 - $bounds.X
    $ty = ($size - $bounds.Height) / 2 - $bounds.Y
    # Pequeño ajuste óptico: la G tiende a verse "alta", bajarla 1% del canvas
    $ty = $ty + ($size * 0.01)
    $mx = New-Object System.Drawing.Drawing2D.Matrix
    $mx.Translate($tx, $ty)
    $gPath.Transform($mx)

    # Drop shadow suave
    $shadowOffset = [float]($size * 0.009)
    $shadowPath = $gPath.Clone()
    $shMx = New-Object System.Drawing.Drawing2D.Matrix
    $shMx.Translate(0, $shadowOffset)
    $shadowPath.Transform($shMx)
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(72, 0, 0, 0))
    $g.FillPath($shadowBrush, $shadowPath)

    # G blanca con leve degradado vertical
    $gBoundsAfter = $gPath.GetBounds()
    $gRect = New-Object System.Drawing.RectangleF $gBoundsAfter.X, $gBoundsAfter.Y, $gBoundsAfter.Width, $gBoundsAfter.Height
    $gBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $gRect, ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), ([System.Drawing.Color]::FromArgb(255, 228, 232, 240)), 90.0
    $g.FillPath($gBrush, $gPath)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "  wrote $outPath"
}

function Render-AdaptiveForeground {
    param([int]$size, [float]$gEmFraction, [string]$outPath)

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Fondo transparente (foreground layer del adaptive icon)
    $g.Clear([System.Drawing.Color]::Transparent)

    $gPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $fontFamily = New-Object System.Drawing.FontFamily "Segoe UI Black"
    $emSize = [float]($size * $gEmFraction)
    $gPath.AddString("G", $fontFamily, ([int][System.Drawing.FontStyle]::Bold), $emSize, (New-Object System.Drawing.PointF 0, 0), [System.Drawing.StringFormat]::GenericTypographic)
    $bounds = $gPath.GetBounds()
    $tx = ($size - $bounds.Width) / 2 - $bounds.X
    $ty = ($size - $bounds.Height) / 2 - $bounds.Y + ($size * 0.01)
    $mx = New-Object System.Drawing.Drawing2D.Matrix
    $mx.Translate($tx, $ty)
    $gPath.Transform($mx)

    # Drop shadow
    $shadowOffset = [float]($size * 0.008)
    $shadowPath = $gPath.Clone()
    $shMx = New-Object System.Drawing.Drawing2D.Matrix
    $shMx.Translate(0, $shadowOffset)
    $shadowPath.Transform($shMx)
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(50, 0, 0, 0))
    $g.FillPath($shadowBrush, $shadowPath)

    $gBoundsAfter = $gPath.GetBounds()
    $gRect = New-Object System.Drawing.RectangleF $gBoundsAfter.X, $gBoundsAfter.Y, $gBoundsAfter.Width, $gBoundsAfter.Height
    $gBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $gRect, ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), ([System.Drawing.Color]::FromArgb(255, 228, 232, 240)), 90.0
    $g.FillPath($gBrush, $gPath)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "  wrote $outPath"
}

function Render-AdaptiveBackground {
    param([int]$size, [string]$outPath)

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Cubre toda el área (el OS hará el masking). Gradient lineal limpio.
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 32, 32, 42)), ([System.Drawing.Color]::FromArgb(255, 8, 8, 12)), 105.0
    $g.FillRectangle($bgBrush, $rect)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "  wrote $outPath"
}

$assetsDir = "C:/Personal/GVM/assets"
if (-not (Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir | Out-Null }

Write-Host "Generando iconos..."
Render-FullIcon -size 1024 -gEmFraction 0.72 -outPath "$assetsDir/icon.png"
Render-AdaptiveForeground -size 1024 -gEmFraction 0.52 -outPath "$assetsDir/adaptive-icon.png"
Render-AdaptiveBackground -size 1024 -outPath "$assetsDir/adaptive-icon-bg.png"
Render-FullIcon -size 1024 -gEmFraction 0.72 -outPath "$assetsDir/splash-icon.png"
Write-Host "Listo."
