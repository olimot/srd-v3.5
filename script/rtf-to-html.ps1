$word = new-object -comobject Word.Application
try {
  $rootDir = "$pwd\public\original-rtf"
  $outDir = "$pwd\.cache\original-html"

  New-Item $outDir -ItemType Directory -ea 0
  get-childitem $rootDir |
  foreach-object {
    $fName = $_.Name
    $doc = $word.Documents.Open("$_")
    $htmlFName = "$outDir\$fName" -Replace ".rtf",".html"
    $doc.SaveAs($htmlFName, 10)
  }
} finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word)
  Remove-Variable word
}
