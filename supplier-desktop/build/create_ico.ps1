Add-Type -AssemblyName System.Drawing

$srcPath = "supplier-desktop\build\logo.png"
$src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))

# Target sizes
$sizes = @(256, 128, 64, 48, 32, 16)
$pngBytesList = @()

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $sz, $sz, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Black)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Calculate aspect-ratio fit
    $scale = [Math]::Min($sz / $src.Width, $sz / $src.Height)
    $w = [int]($src.Width * $scale)
    $h = [int]($src.Height * $scale)
    $x = [int](($sz - $w) / 2)
    $y = [int](($sz - $h) / 2)

    $g.DrawImage($src, $x, $y, $w, $h)
    $g.Dispose()

    if ($sz -eq 256) {
        $bmp.Save("supplier-desktop\build\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,@($sz, $ms.ToArray())
    $ms.Dispose()
    $bmp.Dispose()
}
$src.Dispose()

# Create .ico file containing PNG frames
$fs = [System.IO.File]::Create("supplier-desktop\build\icon.ico")
$bw = New-Object System.IO.BinaryWriter $fs

$count = $pngBytesList.Count
# ICONDIR
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type (1 = icon)
$bw.Write([uint16]$count) # Image count

# Calculate offsets
$offset = 6 + ($count * 16)
$entries = @()

foreach ($item in $pngBytesList) {
    $sz = $item[0]
    $bytes = $item[1]
    $entries += ,@($sz, $bytes, $offset)
    $offset += $bytes.Length
}

# Write ICONDIRENTRY for each image
foreach ($entry in $entries) {
    $sz = $entry[0]
    $bytes = $entry[1]
    $off = $entry[2]

    $wByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $hByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }

    $bw.Write($wByte) # Width
    $bw.Write($hByte) # Height
    $bw.Write([byte]0) # Color count
    $bw.Write([byte]0) # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32) # Bit depth
    $bw.Write([uint32]$bytes.Length) # Image size in bytes
    $bw.Write([uint32]$off) # Offset of image
}

# Write actual PNG data for each image
foreach ($entry in $entries) {
    $bytes = $entry[1]
    $bw.Write($bytes)
}

$bw.Close()
$fs.Close()

Write-Output "ICO successfully created at supplier-desktop\build\icon.ico"
