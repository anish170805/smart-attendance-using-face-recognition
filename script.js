// document.addEventListener('DOMContentLoaded', function() {
//     // Elements
//     const video = document.getElementById('video');
//     const canvas = document.getElementById('canvas');
//     const startBtn = document.getElementById('startBtn');
//     const stopBtn = document.getElementById('stopBtn');
//     const quitBtn = document.getElementById('quitBtn');
//     const statusText = document.getElementById('statusText');
//     const detectedCount = document.getElementById('detectedCount');
//     const totalCount = document.getElementById('totalCount');
//     const currentDate = document.getElementById('currentDate');
//     const attendanceTable = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
    
//     // State variables
//     let stream = null;
//     let faceDetectionActive = false;
//     let detectedStudents = new Set();
//     let allStudents = [];
    
//     // Set current date
//     const today = new Date();
//     currentDate.textContent = today.toLocaleDateString('en-US', { 
//         year: 'numeric', 
//         month: 'long', 
//         day: 'numeric' 
//     });
    
//     // Initialize
//     loadStudentList();
    
//     // Event listeners
//     startBtn.addEventListener('click', startCamera);
//     stopBtn.addEventListener('click', stopCamera);
//     quitBtn.addEventListener('click', quitApplication);
    
//     // Load student list from backend
//     async function loadStudentList() {
//         try {
//             const response = await fetch('/api/students');
//             const data = await response.json();
//             allStudents = data.students;
//             totalCount.textContent = allStudents.length;
//             updateAttendanceTable();
//         } catch (error) {
//             console.error('Error loading student list:', error);
//             statusText.textContent = 'Error loading student data';
//         }
//     }
    
//     // Start camera and face detection
//     async function startCamera() {
//         if (faceDetectionActive) return;
        
//         try {
//             stream = await navigator.mediaDevices.getUserMedia({ 
//                 video: { width: 800, height: 600 } 
//             });
//             video.srcObject = stream;
            
//             faceDetectionActive = true;
//             statusText.textContent = 'Detection active - Looking for faces...';
//             startBtn.disabled = true;
//             stopBtn.disabled = false;
            
//             detectFaces();
//         } catch (error) {
//             console.error('Error accessing camera:', error);
//             statusText.textContent = 'Error accessing camera';
//         }
//     }
    
//     // Face detection function
//     function detectFaces() {
//         if (!faceDetectionActive) return;
        
//         const context = canvas.getContext('2d');
//         context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
//         canvas.toBlob(async (blob) => {
//             try {
//                 const formData = new FormData();
//                 formData.append('image', blob, 'frame.jpg');
                
//                 const response = await fetch('/api/detect', {
//                     method: 'POST',
//                     body: formData
//                 });
                
//                 const result = await response.json();
                
//                 if (result.detected) {
//                     // Draw rectangle around detected face
//                     context.strokeStyle = '#00FF00';
//                     context.lineWidth = 3;
//                     context.strokeRect(
//                         result.face_location.left * canvas.width,
//                         result.face_location.top * canvas.height,
//                         (result.face_location.right - result.face_location.left) * canvas.width,
//                         (result.face_location.bottom - result.face_location.top) * canvas.height
//                     );
                    
//                     // Add name text
//                     context.fillStyle = '#00FF00';
//                     context.font = '20px Arial';
//                     context.fillText(
//                         result.name,
//                         result.face_location.left * canvas.width,
//                         result.face_location.top * canvas.height - 10
//                     );
                    
//                     // Mark attendance if not already marked
//                     if (!detectedStudents.has(result.roll_no)) {
//                         await markAttendance(result.roll_no, result.name);
//                     }
//                 }
                
//                 // Continue detection loop
//                 if (faceDetectionActive) {
//                     requestAnimationFrame(detectFaces);
//                 }
//             } catch (error) {
//                 console.error('Face detection error:', error);
//                 if (faceDetectionActive) {
//                     requestAnimationFrame(detectFaces);
//                 }
//             }
//         }, 'image/jpeg', 0.8);
//     }
    
//     // Mark attendance in backend
//     async function markAttendance(rollNo, name) {
//         try {
//             const response = await fetch('/api/mark', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     roll_no: rollNo,
//                     name: name
//                 })
//             });
            
//             const result = await response.json();
            
//             if (result.success) {
//                 detectedStudents.add(rollNo);
//                 detectedCount.textContent = detectedStudents.size;
//                 updateAttendanceTable(result.timestamp);
                
//                 if (detectedStudents.size === allStudents.length) {
//                     statusText.textContent = 'All students detected!';
//                     stopCamera();
//                 }
//                 return true;
//             } else {
//                 console.log(result.message);
//                 return false;
//             }
//         } catch (error) {
//             console.error('Error marking attendance:', error);
//             statusText.textContent = 'Error marking attendance';
//             return false;
//         }
//     }
    
//     // Update attendance table
//     function updateAttendanceTable(timestamp = null) {
//         attendanceTable.innerHTML = '';
        
//         allStudents.forEach(student => {
//             const row = attendanceTable.insertRow();
//             row.insertCell(0).textContent = student.roll_no;
//             row.insertCell(1).textContent = student.name;
            
//             const statusCell = row.insertCell(2);
//             const timeCell = row.insertCell(3);
            
//             if (detectedStudents.has(student.roll_no)) {
//                 statusCell.textContent = 'Present';
//                 statusCell.className = 'present';
//                 timeCell.textContent = timestamp || new Date().toLocaleTimeString();
//             } else {
//                 statusCell.textContent = 'Absent';
//                 statusCell.className = 'absent';
//                 timeCell.textContent = '-';
//             }
//         });
//     }
    
//     // Stop camera
//     function stopCamera() {
//         if (!faceDetectionActive) return;
        
//         faceDetectionActive = false;
//         if (stream) {
//             stream.getTracks().forEach(track => track.stop());
//             stream = null;
//         }
        
//         video.srcObject = null;
//         const context = canvas.getContext('2d');
//         context.clearRect(0, 0, canvas.width, canvas.height);
        
//         statusText.textContent = 'Camera stopped';
//         startBtn.disabled = false;
//         stopBtn.disabled = true;
//     }
    
//     // Quit application
//     function quitApplication() {
//         stopCamera();
//         window.location.href = '/quit';
//     }
    
//     // Clean up on page unload
//     window.addEventListener('beforeunload', () => {
//         if (stream) {
//             stream.getTracks().forEach(track => track.stop());
//         }
//     });
// });




document.addEventListener('DOMContentLoaded', function() {
        // Elements
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const quitBtn = document.getElementById('quitBtn');
        const statusText = document.getElementById('statusText');
        const detectedCount = document.getElementById('detectedCount');
        const totalCount = document.getElementById('totalCount');
        const currentDate = document.getElementById('currentDate');
        const attendanceTable = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
        
        // State variables
        let stream = null;
        let faceDetectionActive = false;
        let detectedStudents = new Set();
        let allStudents = [];
        
        // Set current date
        const today = new Date();
        currentDate.textContent = today.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Initialize
        loadStudentList();
        
        // Event listeners
        startBtn.addEventListener('click', startCamera);
        stopBtn.addEventListener('click', stopCamera);
        quitBtn.addEventListener('click', quitApplication);
        
        // Load student list from backend
        async function loadStudentList() {
            try {
                const response = await fetch('/api/students');
                const data = await response.json();
                allStudents = data.students;
                totalCount.textContent = allStudents.length;
                updateAttendanceTable();
            } catch (error) {
                console.error('Error loading student list:', error);
                statusText.textContent = 'Error loading student data';
            }
        }
        
        // Start camera and face detection
        async function startCamera() {
            if (faceDetectionActive) return;
            
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 800, height: 600 } 
                });
                video.srcObject = stream;
                
                faceDetectionActive = true;
                statusText.textContent = 'Detection active - Looking for faces...';
                startBtn.disabled = true;
                stopBtn.disabled = false;
                
                detectFaces();
            } catch (error) {
                console.error('Error accessing camera:', error);
                statusText.textContent = 'Error accessing camera';
            }
        }
        
        // Face detection function
        function detectFaces() {
            if (!faceDetectionActive) return;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(async (blob) => {
                try {
                    const formData = new FormData();
                    formData.append('image', blob, 'frame.jpg');
                    
                    const response = await fetch('/api/detect', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.detected) {
                        // Draw rectangle around detected face
                        context.strokeStyle = '#00FF00';
                        context.lineWidth = 3;
                        context.strokeRect(
                            result.face_location.left * canvas.width,
                            result.face_location.top * canvas.height,
                            (result.face_location.right - result.face_location.left) * canvas.width,
                            (result.face_location.bottom - result.face_location.top) * canvas.height
                        );
                        
                        // Add name text
                        context.fillStyle = '#00FF00';
                        context.font = '20px Arial';
                        context.fillText(
                            result.name,
                            result.face_location.left * canvas.width,
                            result.face_location.top * canvas.height - 10
                        );
                        
                        // Mark attendance if not already marked
                        if (!detectedStudents.has(result.roll_no)) {
                            await markAttendance(result.roll_no, result.name);
                        }
                    }
                    
                    // Continue detection loop
                    if (faceDetectionActive) {
                        requestAnimationFrame(detectFaces);
                    }
                } catch (error) {
                    console.error('Face detection error:', error);
                    if (faceDetectionActive) {
                        requestAnimationFrame(detectFaces);
                    }
                }
            }, 'image/jpeg', 0.8);
        }
        
        // Mark attendance in backend
        async function markAttendance(rollNo, name) {
            try {
                const response = await fetch('/api/mark', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roll_no: rollNo,
                        name: name
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    detectedStudents.add(rollNo);
                    detectedCount.textContent = detectedStudents.size;
                    updateAttendanceTable(result.timestamp);
                    
                    if (detectedStudents.size === allStudents.length) {
                        statusText.textContent = 'All students detected!';
                        stopCamera();
                    }
                    return true;
                } else {
                    console.log(result.message);
                    return false;
                }
            } catch (error) {
                console.error('Error marking attendance:', error);
                statusText.textContent = 'Error marking attendance';
                return false;
            }
        }
        
        // Update attendance table
        function updateAttendanceTable(timestamp = null) {
            attendanceTable.innerHTML = '';
            
            allStudents.forEach(student => {
                const row = attendanceTable.insertRow();
                row.insertCell(0).textContent = student.roll_no;
                row.insertCell(1).textContent = student.name;
                
                const statusCell = row.insertCell(2);
                const timeCell = row.insertCell(3);
                
                if (detectedStudents.has(student.roll_no)) {
                    statusCell.textContent = 'Present';
                    statusCell.className = 'present';
                    timeCell.textContent = timestamp || new Date().toLocaleTimeString();
                } else {
                    statusCell.textContent = 'Absent';
                    statusCell.className = 'absent';
                    timeCell.textContent = '-';
                }
            });
        }
        
        // Stop camera
        function stopCamera() {
            if (!faceDetectionActive) return;
            
            faceDetectionActive = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            video.srcObject = null;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            statusText.textContent = 'Camera stopped';
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
        
        // Quit application
        function quitApplication() {
            stopCamera();
            window.location.href = '/quit';
        }
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        });
    });
    // Add to existing code
let eyeVerificationActive = false;
let eyeFrames = [];

async function verifyEyeMovement() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
    
    const formData = new FormData();
    formData.append('image', blob, 'eye_frame.jpg');
    
    try {
        const response = await fetch('/api/verify_eyes', {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('Eye verification failed:', error);
        return { detected: false };
    }
}

// Modify markAttendance function
async function markAttendance(rollNo, name) {
    if (!eyeVerificationActive) {
        statusText.textContent = "Please move your eyes side to side";
        eyeVerificationActive = true;
        eyeFrames = [];
        return false;
    }
    
    const result = await verifyEyeMovement();
    eyeFrames.push(result);
    
    if (result.is_real) {
        // Proceed with attendance marking
        const response = await fetch('/api/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll_no: rollNo, name: name })
        });
        
        const data = await response.json();
        if (data.success) {
            detectedStudents.add(rollNo);
            updateAttendanceTable(data.timestamp);
            eyeVerificationActive = false;
            return true;
        }
    } else if (eyeFrames.length > 10) {
        // Failed after 10 attempts
        statusText.textContent = "Verification failed";
        eyeVerificationActive = false;
    }
    
    return false;
}

// Update detectFaces to show eye verification status
function detectFaces() {
    // ... existing face detection code ...
    
    if (result.detected) {
        // Modify rectangle color during eye verification
        const rectColor = eyeVerificationActive ? '#FFFF00' : '#00FF00';
        ctx.strokeStyle = rectColor;
        
        if (eyeVerificationActive) {
            ctx.fillText(
                "Verifying eyes...", 
                result.face_location.left * canvas.width,
                result.face_location.top * canvas.height - 30
            );
        }
    }
}