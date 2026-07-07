# Minimal static file server for local preview (no Node/Python needed)
# Usage:  powershell -ExecutionPolicy Bypass -File serve.ps1  [-Port 8080]
param([int]$Port = 8080)

$root = $PSScriptRoot
$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".png"  = "image/png"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".woff2" = "font/woff2"
  ".json" = "application/json"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $requestLine = $reader.ReadLine()
    while (($line = $reader.ReadLine()) -and $line -ne "") { }  # drain headers

    $path = "/"
    if ($requestLine -match "^GET\s+(\S+)") { $path = $matches[1] }
    $path = ($path -split "\?")[0]
    if ($path -eq "/") { $path = "/index.html" }
    $path = [Uri]::UnescapeDataString($path)

    $file = Join-Path $root ($path.TrimStart("/") -replace "/", "\")
    $fullRoot = (Resolve-Path $root).Path

    # emulate Vercel's cleanUrls: "/about" -> about.html when there's no
    # exact file at that path and it has no extension of its own
    if (-not (Test-Path $file -PathType Leaf)) {
      if ([string]::IsNullOrEmpty([System.IO.Path]::GetExtension($file))) {
        $file = "$file.html"
      }
    }

    if ((Test-Path $file -PathType Leaf) -and ((Resolve-Path $file).Path.StartsWith($fullRoot))) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    }

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch { }
  finally { $client.Close() }
}
