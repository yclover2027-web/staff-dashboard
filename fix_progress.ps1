
$sjis = [System.Text.Encoding]::GetEncoding(932)
$utf8 = [System.Text.Encoding]::UTF8
$path = "PROGRESS.md"

try {
    $existingContent = [System.IO.File]::ReadAllText($path, $sjis)
} catch {
    $existingContent = [System.IO.File]::ReadAllText($path, $utf8)
}

$now = Get-Date -Format "yyyy-MM-dd HH:mm"
$newProgress = "`n## $now 作業終了`n`n### 【進捗（やったこと）】`n- 住所の『自動履歴蓄積』機能を作成。住所を書き換えると古い住所を自動で裏側に保存するようにしました。`n- 履歴がある人には『📜 過去の履歴』ボタンが表示され、クリックで過去の住所を確認できるようにしました。`n- 住所編集モーダルに『郵便番号検索』ボタンを追加。郵便番号から住所を自動入力できるようにしました。`n- 家族構成の追加フォームをプルダウン形式とドラムロール（年・月・日）形式に変更し、入力ミスを防ぐようにしました。`n- バックエンドプログラム（GAS）を最新版（v6）に更新。新しいURLに接続し直しました。`n`n### 【残りのお仕事（やること）】`n- 実際の運用で不便利点がないか、スタッフの皆さんの声を聞いて調整。`n- 他の項目（名字など）でも履歴が必要になるか検討。`n"

$combined = $existingContent + $newProgress
[System.IO.File]::WriteAllText($path, $combined, $utf8)
