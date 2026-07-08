# Simple System Test for OES
Write-Host "`n=== OES SYSTEM TEST ===`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# Test 1: Health Check
Write-Host "[1] Testing Health Check..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -UseBasicParsing
    if ($health.success) {
        Write-Host " PASS" -ForegroundColor Green
    }
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Register Admin
Write-Host "[2] Registering Admin User..." -NoNewline
$adminUsername = "testadmin$(Get-Random -Max 9999)"
try {
    $adminReg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body (@{
        username = $adminUsername
        password = "Admin123"
        role = "admin"
        email = "admin@test.com"
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $adminId = $adminReg.data.user_id
    Write-Host " PASS (ID: $adminId)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Login Admin
Write-Host "[3] Logging in Admin..." -NoNewline
try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body (@{
        username = $adminUsername
        password = "Admin123"
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $token = $login.data.token
    Write-Host " PASS" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Register Faculty
Write-Host "[4] Registering Faculty User..." -NoNewline
$facultyUsername = "faculty$(Get-Random -Max 9999)"
try {
    $facultyReg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body (@{
        username = $facultyUsername
        password = "Faculty123"
        role = "faculty"
        department = "Computer Science"
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $facultyId = $facultyReg.data.user_id
    Write-Host " PASS (ID: $facultyId)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Register Student
Write-Host "[5] Registering Student User..." -NoNewline
$studentUsername = "student$(Get-Random -Max 9999)"
try {
    $studentReg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body (@{
        username = $studentUsername
        password = "Student123"
        role = "student"
        current_semester = 5
        major_program = "CS"
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $studentId = $studentReg.data.user_id
    Write-Host " PASS (ID: $studentId)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Create Question
Write-Host "[6] Creating Question..." -NoNewline
try {
    $question = Invoke-RestMethod -Uri "$baseUrl/api/questions/add" -Method POST -Body (@{
        faculty_user_id = $facultyId
        content = "What is 2+2?"
        question_type = "MCQ"
        difficulty_level = "EASY"
        subject_topic = "Math"
        tags = "arithmetic"
        correct_answer = "B"
        option_a = "3"
        option_b = "4"
        option_c = "5"
        option_d = "6"
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $questionId = $question.question_id
    Write-Host " PASS (ID: $questionId)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Create Exam
Write-Host "[7] Creating Exam..." -NoNewline
try {
    $exam = Invoke-RestMethod -Uri "$baseUrl/api/exams/create" -Method POST -Body (@{
        title = "Test Exam"
        duration_minutes = 30
        scheduled_time = "2026-06-15 10:00:00"
        faculty_user_id = $facultyId
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $examId = $exam.exam_id
    Write-Host " PASS (ID: $examId)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Assign Question to Exam
Write-Host "[8] Assigning Question to Exam..." -NoNewline
try {
    $assign = Invoke-RestMethod -Uri "$baseUrl/api/exam-questions/assign" -Method POST -Body (@{
        exam_id = $examId
        question_id = $questionId
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    Write-Host " PASS" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Assign Student to Exam
Write-Host "[9] Assigning Student to Exam..." -NoNewline
try {
    $assignStudent = Invoke-RestMethod -Uri "$baseUrl/api/student-exams/assign" -Method POST -Body (@{
        student_user_id = $studentId
        exam_id = $examId
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    Write-Host " PASS" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Start Exam Attempt
Write-Host "[10] Starting Exam Attempt..." -NoNewline
try {
    $attempt = Invoke-RestMethod -Uri "$baseUrl/api/attempts/start" -Method POST -Body (@{
        student_user_id = $studentId
        exam_id = $examId
    } | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    $attemptId = $attempt.attempt_id
    Write-Host " PASS (ID: $attemptId)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ALL TESTS COMPLETED ===`n" -ForegroundColor Cyan
Write-Host "Test Users Created:" -ForegroundColor Yellow
Write-Host "  Admin: $adminUsername / Admin123 (ID: $adminId)" -ForegroundColor Gray
Write-Host "  Faculty: $facultyUsername / Faculty123 (ID: $facultyId)" -ForegroundColor Gray
Write-Host "  Student: $studentUsername / Student123 (ID: $studentId)" -ForegroundColor Gray
Write-Host "`nTest Data Created:" -ForegroundColor Yellow
Write-Host "  Question ID: $questionId" -ForegroundColor Gray
Write-Host "  Exam ID: $examId" -ForegroundColor Gray
Write-Host "  Attempt ID: $attemptId" -ForegroundColor Gray
Write-Host "`nDashboard: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
