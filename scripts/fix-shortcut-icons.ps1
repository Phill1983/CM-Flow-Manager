$icon = 'C:\Program Files\CM Flow Manager\resources\icon.ico'
$sh = New-Object -ComObject WScript.Shell
$targets = @(
  'C:\Users\Public\Desktop\CM Flow Manager.lnk',
  'C:\ProgramData\Microsoft\Windows\Start Menu\Programs\CM Flow Manager.lnk'
)
foreach ($p in $targets) {
  if (Test-Path $p) {
    $sc = $sh.CreateShortcut($p)
    $sc.IconLocation = "$icon,0"
    $sc.Save()
    Write-Output "FIXED $p -> $($sh.CreateShortcut($p).IconLocation)"
  } else {
    Write-Output "MISSING $p"
  }
}
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class NativeShell {
  [DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
'@
[NativeShell]::SHChangeNotify(0x8000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)
