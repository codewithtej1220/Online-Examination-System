# Online Examination System - Complete System Test Script
# This script tests all major functionality of the OES

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   OES COMPLETE SYSTEM TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testResults = @()

# Helper function to make API calls
function Invoke-ApiTest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$Token = $null,
        [string]$Description
    )
    
    Write-Host "Testing: $Description..." -NoNewline
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host " ✓ PASSED" -ForegroundColor Green
        return @{
            success = $true
            data = $response
            description = $Description
        }
    } catch {
        Write-Host " ✗ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            success = $false
            error = $_.Exception.Message
            description = $Description
        }
    }
}

# Test 1: Health Check
Write-Host "`n[1/15] HEALTH CHECK" -ForegroundColor Yellow
$healthTest = Invoke-ApiTest -Endpoint "/api/health" -Description "Server health check"
$testResults += $healthTest

if (-not $healthTest.success) {
    Write-Host "`nServer is not responding. Please ensure the server is running on port 5000." -ForegroundColor Red
    Write-Host "Run: node server.js" -ForegroundColor Yellow
    exit 1
}

# Test 2: Register Admin User
Write-Host "`n[2/15] REGISTER ADMIN USER" -ForegroundColor Yellow
$adminUsername = "testadmin_$(Get-Random -Minimum 1000 -Maximum 9999)"
$adminBody = @{
    username = $adminUsername
    password = "admin123"
    role = "admin"
    email = "admin@test.com"
}
$adminRegister = Invoke-ApiTest -Endpoint "/api/auth/register" -Method "POST" -Body $adminBody -Description "Register admin user"
$testResults += $adminRegister

if ($adminRegister.success) {
    $adminUserId = $adminRegister.data.data.user_id
    Write-Host "   Admin User ID: $adminUserId" -ForegroundColor Gray
}

# Test 3: Register Faculty User
Write-Host "`n[3/15] REGISTER FACULTY USER" -ForegroundColor Yellow
$facultyUsername = "testfaculty_$(Get-Random -Minimum 1000 -Maximum 9999)"
$facultyBody = @{
    username = $facultyUsername
    password = "faculty123"
    role = "faculty"
    department = "Computer Science"
}
$facultyRegister = Invoke-ApiTest -Endpoint "/api/auth/register" -Method "POST" -Body $facultyBody -Description "Register faculty user"
$testResults += $facultyRegister

if ($facultyRegister.success) {
    $facultyUserId = $facultyRegister.data.data.user_id
    Write-Host "   Faculty User ID: $facultyUserId" -ForegroundColor Gray
}

# Test 4: Register Student User
Write-Host "`n[4/15] REGISTER STUDENT USER" -ForegroundColor Yellow
$studentUsername = "teststudent_$(Get-Random -Minimum 1000 -Maximum 9999)"
$studentBody = @{
    username = $studentUsername
    password = "student123"
    role = "student"
    current_semester = 5
    major_program = "Computer Science"
}
$studentRegister = Invoke-ApiTest -Endpoint "/api/auth/register" -Method "POST" -Body $studentBody -Description "Register student user"
$testResults += $studentRegister

if ($studentRegister.success) {
    $studentUserId = $studentRegister.data.data.user_id
    Write-Host "   Student User ID: $studentUserId" -ForegroundColor Gray
}

# Test 5: Admin Login
Write-Host "`n[5/15] LOGIN ADMIN" -ForegroundColor Yellow
$loginBody = @{
    username = $adminUsername
    password = "admin123"
}
$adminLogin = Invoke-ApiTest -Endpoint "/api/auth/login" -Method "POST" -Body $loginBody -Description "Admin login"
$testResults += $adminLogin

if ($adminLogin.success) {
    $adminToken = $adminLogin.data.data.token
    Write-Host "   Token received: $($adminToken.Substring(0,20))..." -ForegroundColor Gray
}

# Test 6: Faculty Login
Write-Host "`n[6/15] LOGIN FACULTY" -ForegroundColor Yellow
$facultyLoginBody = @{
    username = $facultyUsername
    password = "faculty123"
}
$facultyLogin = Invoke-ApiTest -Endpoint "/api/auth/login" -Method "POST" -Body $facultyLoginBody -Description "Faculty login"
$testResults += $facultyLogin

if ($facultyLogin.success) {
    $facultyToken = $facultyLogin.data.data.token
}

# Test 7: Get Admin Profile
Write-Host "`n[7/15] GET PROFILE" -ForegroundColor Yellow
$profileTest = Invoke-ApiTest -Endpoint "/api/auth/profile" -Token $adminToken -Description "Get user profile"
$testResults += $profileTest

# Test 8: Create Question
Write-Host "`n[8/15] CREATE QUESTION" -ForegroundColor Yellow
$questionBody = @{
    faculty_user_id = $facultyUserId
    content = "What is the capital of France?"
    difficulty_level = "EASY"
    subject_topic = "Geography"
    tags = "capitals,geography"
    correct_answer = "B"
    option_a = "London"
    option_b = "Paris"
    option_c = "Berlin"
    option_d = "Madrid"
}
$questionTest = Invoke-ApiTest -Endpoint "/api/questions/add" -Method "POST" -Body $questionBody -Description "Create question"
$testResults += $questionTest

if ($questionTest.success) {
    $questionId = $questionTest.data.question_id
    Write-Host "   Question ID: $questionId" -ForegroundColor Gray
}

# Test 9: Create Another Question
Write-Host "`n[9/15] CREATE SECOND QUESTION" -ForegroundColor Yellow
$question2Body = @{
    faculty_user_id = $facultyUserId
    content = "What is 5 + 3?"
    difficulty_level = "EASY"
    subject_topic = "Mathematics"
    tags = "arithmetic,math"
    correct_answer = "C"
    option_a = "6"
    option_b = "7"
    option_c = "8"
    option_d = "9"
}
$question2Test = Invoke-ApiTest -Endpoint "/api/questions/add" -Method "POST" -Body $question2Body -Description "Create second question"
$testResults += $question2Test

if ($question2Test.success) {
    $question2Id = $question2Test.data.question_id
    Write-Host "   Question ID: $question2Id" -ForegroundColor Gray
}

# Test 10: Create Exam
Write-Host "`n[10/15] CREATE EXAM" -ForegroundColor Yellow
$examBody = @{
    title = "Test Exam $(Get-Date -Format 'HHmmss')"
    duration_minutes = 30
    scheduled_time = (Get-Date).AddDays(1).ToString("yyyy-MM-dd HH:mm:ss")
    faculty_user_id = $facultyUserId
}
$examTest = Invoke-ApiTest -Endpoint "/api/exams/create" -Method "POST" -Body $examBody -Description "Create exam"
$testResults += $examTest

if ($examTest.success) {
    $examId = $examTest.data.exam_id
    Write-Host "   Exam ID: $examId" -ForegroundColor Gray
}

# Test 11: Assign Question to Exam
Write-Host "`n[11/15] ASSIGN QUESTION TO EXAM" -ForegroundColor Yellow
$assignQuestionBody = @{
    exam_id = $examId
    question_id = $questionId
}
$assignQuestionTest = Invoke-ApiTest -Endpoint "/api/exam-questions/assign" -Method "POST" -Body $assignQuestionBody -Description "Assign question to exam"
$testResults += $assignQuestionTest

# Test 12: Assign Second Question to Exam
Write-Host "`n[12/15] ASSIGN SECOND QUESTION TO EXAM" -ForegroundColor Yellow
$assignQuestion2Body = @{
    exam_id = $examId
    question_id = $question2Id
}
$assignQuestion2Test = Invoke-ApiTest -Endpoint "/api/exam-questions/assign" -Method "POST" -Body $assignQuestion2Body -Description "Assign second question to exam"
$testResults += $assignQuestion2Test

# Test 13: Assign Student to Exam
Write-Host "`n[13/15] ASSIGN STUDENT TO EXAM" -ForegroundColor Yellow
$assignStudentBody = @{
    student_user_id = $studentUserId
    exam_id = $examId
}
$assignStudentTest = Invoke-ApiTest -Endpoint "/api/student-exams/assign" -Method "POST" -Body $assignStudentBody -Description "Assign student to exam"
$testResults += $assignStudentTest

# Test 14: Start Exam Attempt
Write-Host "`n[14/15] START EXAM ATTEMPT" -ForegroundColor Yellow
$startAttemptBody = @{
    student_user_id = $studentUserId
    exam_id = $examId
}
$attemptTest = Invoke-ApiTest -Endpoint "/api/attempts/start" -Method "POST" -Body $startAttemptBody -Description "Start exam attempt"
$testResults += $attemptTest

if ($attemptTest.success) {
    $attemptId = $attemptTest.data.attempt_id
    Write-Host "   Attempt ID: $attemptId" -ForegroundColor Gray
}

# Test 15: Get Exam Paper
Write-Host "`n[15/15] GET EXAM PAPER" -ForegroundColor Yellow
$paperTest = Invoke-ApiTest -Endpoint "/api/exams/paper/$examId" -Description "Get exam paper"
$testResults += $paperTest

if ($paperTest.success) {
    $questionCount = $paperTest.data.questions.Count
    Write-Host "   Questions loaded: $questionCount" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passedTests = ($testResults | Where-Object { $_.success -eq $true }).Count
$failedTests = ($testResults | Where-Object { $_.success -eq $false }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

if ($failedTests -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.success -eq $false } | ForEach-Object {
        Write-Host "  - $($_.description)" -ForegroundColor Red
        Write-Host "    Error: $($_.error)" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan

if ($failedTests -eq 0) {
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`nTest Data Created:" -ForegroundColor Yellow
    Write-Host "  - Admin User ID: $adminUserId (username: $adminUsername)" -ForegroundColor Gray
    Write-Host "  - Faculty User ID: $facultyUserId (username: $facultyUsername)" -ForegroundColor Gray
    Write-Host "  - Student User ID: $studentUserId (username: $studentUsername)" -ForegroundColor Gray
    Write-Host "  - Question IDs: $questionId, $question2Id" -ForegroundColor Gray
    Write-Host "  - Exam ID: $examId" -ForegroundColor Gray
    Write-Host "  - Attempt ID: $attemptId" -ForegroundColor Gray
    Write-Host "`nYou can now test the dashboard at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Use the credentials above to login and explore!" -ForegroundColor Cyan
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please check the errors above and review the server logs." -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
