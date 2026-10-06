# Run yourself from PowerShell. Password is prompted privately, never a CLI argument.
$ErrorActionPreference = 'Stop'
$accountName = Read-Host 'Nombre del propietario'
$accountEmail = Read-Host 'Correo del propietario'
$privatePassword = Read-Host 'Contraseña (mínimo 12 caracteres)' -AsSecureString
$privatePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($privatePassword)
try {
  $accountPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($privatePointer)
  $accountJson = @{name=$accountName;email=$accountEmail;password=$accountPassword} | ConvertTo-Json -Compress
  $accountJson | & C:/Windows/System32/OpenSSH/ssh.exe -i "$env:USERPROFILE/.ssh/vivero_vps" -o BatchMode=yes root@179.236.238.111 'docker exec -i catering-oculto-app-1 node server-dist/owner.js'
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el propietario. No se modificaron contraseñas existentes.' }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($privatePointer)
  $accountPassword = $null
  $accountJson = $null
  $privatePassword.Dispose()
}
