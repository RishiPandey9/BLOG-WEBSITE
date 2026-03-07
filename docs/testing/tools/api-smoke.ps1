$base='http://localhost:3000'
function Invoke-Test {
  param([string]$Name,[string]$Method,[string]$Path,[int[]]$Expected,[string]$Body='',[string]$ContentType='application/json',[hashtable]$Headers=@{})
  $url = "$base$Path"
  try {
    if ($Body -ne '') { $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method $Method -Headers $Headers -Body $Body -ContentType $ContentType }
    else { $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method $Method -Headers $Headers }
    $status = [int]$resp.StatusCode
    $ok = $Expected -contains $status
    [pscustomobject]@{Name=$Name; Method=$Method; Path=$Path; Status=$status; Expected=($Expected -join '/'); Result=($(if($ok){'PASS'}else{'FAIL'}))}
  } catch {
    $status = [int]$_.Exception.Response.StatusCode.value__
    $ok = $Expected -contains $status
    [pscustomobject]@{Name=$Name; Method=$Method; Path=$Path; Status=$status; Expected=($Expected -join '/'); Result=($(if($ok){'PASS'}else{'FAIL'}))}
  }
}
$tests = @()
$tests += Invoke-Test 'Auth providers' 'GET' '/api/auth/providers' @(200)
$tests += Invoke-Test 'Auth session' 'GET' '/api/auth/session' @(200)
$tests += Invoke-Test 'Signup invalid body' 'POST' '/api/auth/signup' @(400) '{"name":"","email":"","password":""}'
$tests += Invoke-Test 'Bookmarks public read' 'GET' '/api/bookmarks' @(200)
$tests += Invoke-Test 'Bookmarks toggle unauth' 'POST' '/api/bookmarks' @(401) '{"postId":"1"}'
$tests += Invoke-Test 'Comments missing postId' 'GET' '/api/comments' @(400)
$tests += Invoke-Test 'Comments by post' 'GET' '/api/comments?postId=1' @(200)
$tests += Invoke-Test 'Comments pending unauth' 'GET' '/api/comments?pending=true&postId=1' @(403)
$tests += Invoke-Test 'Comment action unauth' 'PATCH' '/api/comments/c1' @(401) '{"action":"like"}'
$tests += Invoke-Test 'Create order unauth' 'POST' '/api/payment/create-order' @(401)
$tests += Invoke-Test 'Verify payment unauth' 'POST' '/api/payment/verify' @(401) '{"razorpay_order_id":"o","razorpay_payment_id":"p","razorpay_signature":"s"}'
$tests += Invoke-Test 'Webhook invalid signature' 'POST' '/api/payment/webhook' @(400) '{"event":"payment.failed","payload":{"payment":{"entity":{"id":"p","order_id":"o","currency":"INR","notes":{"userEmail":"a@b.com"}}}}}'
$tests += Invoke-Test 'Posts public list' 'GET' '/api/posts' @(200)
$tests += Invoke-Test 'Posts mine unauth' 'GET' '/api/posts?mine=true' @(200)
$tests += Invoke-Test 'Posts all unauth' 'GET' '/api/posts?all=true' @(403)
$tests += Invoke-Test 'Create post unauth' 'POST' '/api/posts' @(401) '{"title":"x","content":"y","category":"Technology"}'
$tests += Invoke-Test 'Update post unauth' 'PATCH' '/api/posts/1' @(401) '{"title":"updated"}'
$tests += Invoke-Test 'Delete post unauth' 'DELETE' '/api/posts/1' @(403)
$tests += Invoke-Test 'Post like status' 'GET' '/api/posts/1/like' @(200)
$tests += Invoke-Test 'Post like toggle unauth' 'POST' '/api/posts/1/like' @(401) '{}'
$tests += Invoke-Test 'Seed GET dev' 'GET' '/api/seed' @(200)
$tests += Invoke-Test 'Seed POST unauth' 'POST' '/api/seed' @(403)
$tests += Invoke-Test 'Subscription GET unauth' 'GET' '/api/subscription' @(401)
$tests += Invoke-Test 'Subscription stats unauth' 'POST' '/api/subscription' @(401)
$tests += Invoke-Test 'Subscription cancel unauth' 'DELETE' '/api/subscription' @(401)
$tests += Invoke-Test 'Upload unauth' 'POST' '/api/upload' @(401)
$tests | Export-Csv -NoTypeInformation -Path .\api-smoke-results.csv
$tests | ConvertTo-Json -Depth 4 | Set-Content .\api-smoke-results.json
Write-Output 'DONE'
