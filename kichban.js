document.addEventListener('DOMContentLoaded', function() {
    // ============================================================
    // 1. KHAI BÁO BIẾN & CẤU HÌNH
    // ============================================================
    const easyBtn = document.getElementById('easy-btn');
    const hardBtn = document.getElementById('hard-btn');
    const pauseBtn = document.getElementById('pause-btn'); 
    const audioBtn = document.getElementById('audio-btn'); 
    const hintBtn = document.getElementById('hint-btn'); 
    const playButton = document.getElementById('play-button');
    const settingButton = document.getElementById('setting-button');
    
    const currentTimeEl = document.getElementById('currentTime');
    const bestTimeEl = document.getElementById('bestTime');
    
    const boxLeft = document.getElementById('box-left');
    const boxRight = document.getElementById('box-right');
    const hearts = document.querySelectorAll('.heart');

    const LEVEL_ID = 'case1'; 
    let seconds = 0;              
    let timerInterval = null;     
    let isPaused = false;         
    
    // --- CẤU HÌNH ÂM THANH (MỚI) ---
    let isMuted = false; // Trạng thái âm thanh (Mặc định là Bật)

    // 1. Tiếng Click (Hiệu ứng)
    const clickSound = new Audio('click1.mp3'); 
    clickSound.preload = 'auto'; 

    // 2. Nhạc nền (Theme)
    const bgMusic = new Audio('theme.mp3'); 
    bgMusic.loop = true;   // Cho phép lặp lại liên tục
    bgMusic.volume = 0.4;  // Để âm lượng nhỏ (40%) để không át tiếng click

    // Biến Gameplay
    let lives = 3;              
    let totalDifferences = 0;   
    let foundCount = 0;         
    let bestTime = localStorage.getItem(LEVEL_ID + '_best');

    // ============================================================
    // 2. CÁC HÀM XỬ LÝ ÂM THANH
    // ============================================================

    // Hàm phát tiếng Click
    function playClickSound() {
        if (isMuted) return; // Nếu đang Mute thì không kêu
        
        if (clickSound) {
            clickSound.currentTime = 0; 
            clickSound.play().catch(e => {});
        }
    }
  
    // Hàm Bật/Tắt Âm thanh (Xử lý nút Audio)
    function toggleAudio() {
        if (isMuted) {
            // ==> ĐANG TẮT -> BẤM ĐỂ BẬT (UNMUTE)
            isMuted = false;
            
            // 1. Đổi giao diện nút
            audioBtn.innerHTML = "🔊 Audio";
            audioBtn.style.opacity = "1";
            
            // 2. Bật nhạc nền
            bgMusic.play().catch(e => console.log("Chưa tương tác với web nên chưa tự phát nhạc được"));

        } else {
            // ==> ĐANG BẬT -> BẤM ĐỂ TẮT (MUTE)
            isMuted = true;

            // 1. Đổi giao diện nút
            audioBtn.innerHTML = "🔇 Muted"; 
            audioBtn.style.opacity = "0.7"; 

            // 2. Tắt nhạc nền
            bgMusic.pause();
        }
    }

    // ============================================================
    // 3. LOGIC GAMEPLAY
    // ============================================================

    function handleWrongClick() {
        if (isPaused || lives <= 0) return; 

        console.log("Bấm sai! Trừ tim."); 
        lives--; 
        playClickSound(); 

        hearts.forEach(h => h.classList.remove('lost'));
        for (let i = lives; i < 3; i++) {
            if (hearts[i]) hearts[i].classList.add('lost');
        }

        if (lives <= 0) {
            clearInterval(timerInterval);
            bgMusic.pause(); // Hết giờ thì tắt nhạc nền luôn
            
            const loseModal = document.getElementById('game-over-modal');
            if (loseModal) {
                setTimeout(() => { loseModal.style.display = 'flex'; }, 500);
            } else {
                alert("OOPS! Game Over.");
                location.reload();
            }
        }
    }

    window.handleDiffClick = function(event, diffIndex) {
        event.stopPropagation(); 
        
        if (isPaused || lives <= 0) return;

        const leftZone = document.getElementById(`diff-L-${diffIndex}`);
        const rightZone = document.getElementById(`diff-R-${diffIndex}`);

        if (leftZone.classList.contains('found')) return;

        leftZone.classList.add('found');
        rightZone.classList.add('found');

        foundCount++;
        playClickSound();

        if (foundCount >= totalDifferences) {
            setTimeout(() => {
                stopGameAndCheckRecord();
            }, 500);
        }
    };

    // ============================================================
    // 4. CÁC HÀM HỖ TRỢ
    // ============================================================

    function formatTime(sec) {
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            if (currentTimeEl) currentTimeEl.innerText = formatTime(seconds);
        }, 1000);
    }

    function togglePause() {
        if (isPaused) {
            startTimer(); 
            if (!isMuted) bgMusic.play(); // Chạy lại nhạc nếu không mute
            
            pauseBtn.innerHTML = "⏸ Pause"; 
            pauseBtn.style.backgroundColor = "#886392"; 
            pauseBtn.style.opacity = "1";
            isPaused = false;
        } else {
            clearInterval(timerInterval); 
            bgMusic.pause(); // Dừng nhạc khi Pause game
            
            pauseBtn.innerHTML = "▶ Resume"; 
            pauseBtn.style.backgroundColor = "#886392"; 
            pauseBtn.style.opacity = "0.7";
            isPaused = true;
        }
    }

    function stopGameAndCheckRecord() {
        clearInterval(timerInterval);
        bgMusic.pause(); // Thắng rồi thì tắt nhạc nền

        if (!bestTime || seconds < bestTime) {
            bestTime = seconds;
            localStorage.setItem(LEVEL_ID + '_best', bestTime);
            if (bestTimeEl) bestTimeEl.innerText = formatTime(bestTime);
        }

        const modal = document.getElementById('victory-modal');
        if (modal) {
            modal.style.display = 'flex'; 
        } else {
            alert("WELL DONE! YOUR SCORE: +100");
        }
    }
 
    // --- THÊM HÀM XỬ LÝ HINT VÀO TRONG FILE JS ---

    // Hàm mở bảng Hint
    function showHint() {
        const hintModal = document.getElementById('hint-modal');
        if (hintModal) {
            hintModal.style.display = 'flex';
            
            // Nếu muốn game tạm dừng khi đang đọc kiến thức thì bỏ comment dòng dưới:
            // if (!isPaused) togglePause(); 
        }
    }

    // Hàm đóng bảng Hint (Được gọi từ nút "Đã hiểu" bên HTML)
    window.closeHint = function() {
        const hintModal = document.getElementById('hint-modal');
        if (hintModal) {
            hintModal.style.display = 'none';
        }
    }

    function initGame() {
        // Logic trang Menu (Chưa có đồng hồ)
        if (!currentTimeEl) {
            if (easyBtn) easyBtn.addEventListener('click', () => {
                playClickSound();
                setTimeout(() => window.location.href = 'game_case1.html', 200);
            });
            if (hardBtn) hardBtn.addEventListener('click', () => {
                playClickSound();
                window.location.href = 'game_case2.1.html';
            });
            return;
        }

        // Logic trang Game (Có đồng hồ)
        if (bestTimeEl) bestTimeEl.innerText = bestTime ? formatTime(bestTime) : "00:00";
        seconds = 0;
        lives = 3; 
        hearts.forEach(h => h.classList.remove('lost')); 
        currentTimeEl.innerText = "00:00";
        startTimer();
        
        // Tự động phát nhạc nền khi vào game (Cần người dùng click 1 cái mới chạy được do chính sách trình duyệt)
        // Mẹo: Gắn sự kiện click lần đầu vào màn hình để bật nhạc
        document.body.addEventListener('click', function() {
            if (!isMuted && bgMusic.paused) {
                bgMusic.play().catch(e => {});
            }
        }, { once: true }); // Chỉ chạy 1 lần duy nhất

        if (boxLeft) boxLeft.addEventListener('click', handleWrongClick);
        if (boxRight) boxRight.addEventListener('click', handleWrongClick);
    }

    // --- BỔ SUNG: TỰ ĐỘNG ĐẾM ĐIỂM KHÁC BIỆT TRONG HTML ---
    // Đếm tất cả các div có class 'diff-zone' và ID bắt đầu bằng 'diff-L-'
    const diffZones = document.querySelectorAll('.diff-zone[id^="diff-L-"]');
    totalDifferences = diffZones.length; // Tổng số điểm đã được đếm tự động
    
    // Đảm bảo không có lỗi nếu không có điểm nào
    if (totalDifferences === 0) {
        console.error("LỖI: Không tìm thấy điểm khác biệt nào trong HTML!");
        // Thêm alert hoặc logic xử lý lỗi ở đây
    } 

    foundCount = 0; // Reset số điểm tìm thấy

    // Gắn sự kiện
    if (audioBtn) audioBtn.addEventListener('click', toggleAudio);
    if (pauseBtn) pauseBtn.addEventListener('click', () => { playClickSound(); togglePause(); });

    if (hintBtn) {
        hintBtn.addEventListener('click', function() {
            playClickSound();
            showHint();
        });
    }

    if (playButton) {
    playButton.addEventListener('click', () => {
        // Gọi âm thanh click (nếu đã được định nghĩa)
        if (typeof playClickSound === 'function') {
            playClickSound(); 
        }

        // Chuyển sang màn hình chọn cấp độ (khung.html)
        setTimeout(() => {
            window.location.href = 'khung.html';
        }, 200);
    });
}
  
    if (settingButton) {
    settingButton.addEventListener('click', () => {
        if (typeof playClickSound === 'function') {
            playClickSound(); 
        }
        alert('Settings coming soon!');
    });
}
    initGame();
});
 