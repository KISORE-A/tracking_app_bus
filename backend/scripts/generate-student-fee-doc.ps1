param(
    [Parameter(Mandatory = $true)][string]$TemplatePath,
    [Parameter(Mandatory = $true)][string]$OutputDocx,
    [Parameter(Mandatory = $true)][string]$OutputPdf,
    [Parameter(Mandatory = $true)][string]$FieldsJsonBase64
)

$ErrorActionPreference = "Stop"

$json = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($FieldsJsonBase64))
$fields = $json | ConvertFrom-Json

$outputDir = Split-Path -Parent $OutputDocx
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

function Replace-AllText {
    param(
        [object]$Document,
        [string]$FindText,
        [string]$ReplaceText
    )

    $range = $Document.Content
    $find = $range.Find
    $find.ClearFormatting() | Out-Null
    $find.Replacement.ClearFormatting() | Out-Null
    $find.Text = $FindText
    $find.Replacement.Text = $ReplaceText
    $find.Forward = $true
    $find.Wrap = 1
    $find.Format = $false
    $find.MatchCase = $false
    $find.MatchWholeWord = $false
    $find.MatchWildcards = $false
    $find.MatchSoundsLike = $false
    $find.MatchAllWordForms = $false
    $find.Execute($FindText, $false, $false, $false, $false, $false, $true, 1, $false, $ReplaceText, 2) | Out-Null
}

Copy-Item $TemplatePath $OutputDocx -Force

$word = $null
$document = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $document = $word.Documents.Open($OutputDocx, $false, $false)

    $replacementMap = [ordered]@{
        '2023-2027' = [string]$fields.academicYear
        'KISORE .A' = [string]$fields.studentName
        '7376231ME123' = [string]$fields.registerNumber
        'MECHANICAL ENGINEERING' = [string]$fields.department
        'BANNARI AMMAN INSTITUTE OF TECHNOLOGY.SATHY' = [string]$fields.collegeName
        'ANANTHAN R' = [string]$fields.parentName
        '9486600103' = [string]$fields.mobileNumber
        'kisore.me23@bitsathy.ac.in' = [string]$fields.email
        '8' = [string]$fields.busRouteNumber
        '19000' = [string]$fields.totalFees
        'Cash / UPI / Card / Net Banking' = [string]$fields.paymentMode
        '5454565465456561' = [string]$fields.transactionId
        '23.03.2026' = [string]$fields.paymentDate
        '25063' = [string]$fields.receiptNumber
        'AKSHAYAA M' = [string]$fields.receivedBy
        'AKSHAYAA' = [string]$fields.officeUseName
        'KISORE' = [string]$fields.studentSignatureName
        'ANANTHAN' = [string]$fields.parentSignatureName
        'NIL' = [string]$fields.remainingBalance
    }

    foreach ($entry in $replacementMap.GetEnumerator()) {
        if ($null -ne $entry.Value -and [string]::IsNullOrWhiteSpace([string]$entry.Value) -eq $false) {
            Replace-AllText -Document $document -FindText $entry.Key -ReplaceText ([string]$entry.Value)
        }
    }

    $document.Save()
    $document.SaveAs([ref]$OutputPdf, [ref]17)
} finally {
    if ($document) { $document.Close([ref]$false) }
    if ($word) { $word.Quit() }
}
