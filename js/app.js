/**
 * 兒童專屬成長電子存摺 - 主應用邏輯
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 狀態管理
  const AppState = {
    settings: {},
    transactions: [],
    goals: [],
    isAdmin: false,
    enteredPin: '',
    isBalanceMasked: false,
    activeTab: 'passbook',
    filterCategory: 'all',
    selectedTxnForEdit: null
  };

  // DOM 元素
  const DOM = {
    // 頂部
    headerTitle: document.getElementById('displayHeaderTitle'),
    syncStatusBadge: document.getElementById('syncStatusBadge'),
    syncStatusText: document.getElementById('syncStatusText'),
    btnParentAdmin: document.getElementById('btnParentAdmin'),
    adminBtnLabel: document.getElementById('adminBtnLabel'),
    btnToggleSound: document.getElementById('btnToggleSound'),
    soundIcon: document.getElementById('soundIcon'),
    
    // 頁籤
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    goalsCountBadge: document.getElementById('goalsCountBadge'),

    // 存摺封面
    passbookCoverImg: document.getElementById('passbookCoverImg'),
    coverPlaceholder: document.getElementById('coverPlaceholder'),
    defaultCoverTitle: document.getElementById('defaultCoverTitle'),
    displayChildName: document.getElementById('displayChildName'),
    displayAccountNumber: document.getElementById('displayAccountNumber'),
    displayAccountOpenDate: document.getElementById('displayAccountOpenDate'),
    displayCurrency: document.getElementById('displayCurrency'),
    displayTotalBalance: document.getElementById('displayTotalBalance'),
    displayEncouragement: document.getElementById('displayEncouragement'),
    btnToggleBalanceMask: document.getElementById('btnToggleBalanceMask'),
    eyeIcon: document.getElementById('eyeIcon'),
    btnQuickAddDeposit: document.getElementById('btnQuickAddDeposit'),
    currentStampDate: document.getElementById('currentStampDate'),

    // 存摺表格
    displayTxnCount: document.getElementById('displayTxnCount'),
    filterTxnCategory: document.getElementById('filterTxnCategory'),
    txnTableBody: document.getElementById('txnTableBody'),

    // 願望清單
    goalsListGrid: document.getElementById('goalsListGrid'),
    btnOpenAddGoal: document.getElementById('btnOpenAddGoal'),

    // 統計
    statTotalDeposits: document.getElementById('statTotalDeposits'),
    statTotalWithdraws: document.getElementById('statTotalWithdraws'),
    statTotalRewards: document.getElementById('statTotalRewards'),
    statCompletedGoals: document.getElementById('statCompletedGoals'),
    categoryBars: document.getElementById('categoryBars'),

    // PIN 彈窗
    pinModal: document.getElementById('pinModal'),
    pinDots: document.querySelectorAll('.pin-dot'),
    pinKeypadBtns: document.querySelectorAll('.keypad-btn[data-key]'),
    btnPinClear: document.getElementById('btnPinClear'),
    btnPinBackspace: document.getElementById('btnPinBackspace'),
    pinErrorMsg: document.getElementById('pinErrorMsg'),

    // 家長後台彈窗
    adminModal: document.getElementById('adminModal'),
    adminNavBtns: document.querySelectorAll('.admin-nav-btn'),
    adminTabPanes: document.querySelectorAll('.admin-tab-pane'),
    formAddTransaction: document.getElementById('formAddTransaction'),
    txnType: document.getElementById('txnType'),
    txnAmount: document.getElementById('txnAmount'),
    txnCategory: document.getElementById('txnCategory'),
    txnDate: document.getElementById('txnDate'),
    txnNote: document.getElementById('txnNote'),
    quickCategoryTags: document.getElementById('quickCategoryTags'),

    // 利息面板
    interestRate: document.getElementById('interestRate'),
    interestPeriod: document.getElementById('interestPeriod'),
    calcBaseBalance: document.getElementById('calcBaseBalance'),
    calcAnnualInterest: document.getElementById('calcAnnualInterest'),
    calcInterestAmount: document.getElementById('calcInterestAmount'),
    btnPayInterest: document.getElementById('btnPayInterest'),

    // 封面與存摺設定
    formPassbookSettings: document.getElementById('formPassbookSettings'),
    coverFileInput: document.getElementById('coverFileInput'),
    coverUrlInput: document.getElementById('coverUrlInput'),
    settingsCoverPreview: document.getElementById('settingsCoverPreview'),
    btnResetCover: document.getElementById('btnResetCover'),
    settingChildName: document.getElementById('settingChildName'),
    settingAccountNumber: document.getElementById('settingAccountNumber'),
    settingPassbookTitle: document.getElementById('settingPassbookTitle'),
    settingCurrency: document.getElementById('settingCurrency'),
    settingParentPin: document.getElementById('settingParentPin'),

    // Firebase 設定
    firebaseConfigJson: document.getElementById('firebaseConfigJson'),
    firebaseConfigStatus: document.getElementById('firebaseConfigStatus'),
    firebaseStatusLabel: document.getElementById('firebaseStatusLabel'),
    btnSaveFirebaseConfig: document.getElementById('btnSaveFirebaseConfig'),
    btnDisconnectFirebase: document.getElementById('btnDisconnectFirebase'),

    // 備份與安全
    btnExportJson: document.getElementById('btnExportJson'),
    btnTriggerImportJson: document.getElementById('btnTriggerImportJson'),
    importJsonInput: document.getElementById('importJsonInput'),
    btnResetAllData: document.getElementById('btnResetAllData'),

    // 願望彈窗
    goalModal: document.getElementById('goalModal'),
    formAddGoal: document.getElementById('formAddGoal'),
    goalTitle: document.getElementById('goalTitle'),
    goalTargetAmount: document.getElementById('goalTargetAmount'),
    goalIcon: document.getElementById('goalIcon'),
    goalNote: document.getElementById('goalNote'),

    // 交易編輯彈窗
    editTxnModal: document.getElementById('editTxnModal'),
    editTxnInfoText: document.getElementById('editTxnInfoText'),
    btnDeleteTxn: document.getElementById('btnDeleteTxn')
  };

  // 初始化當前日期
  const todayStr = new Date().toISOString().slice(0, 10);
  if (DOM.txnDate) DOM.txnDate.value = todayStr;
  if (DOM.currentStampDate) {
    const d = new Date();
    DOM.currentStampDate.textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // 1. 初始化 Firebase 與資料監聽
  await FirebaseService.init((isOnline, statusText) => {
    DOM.syncStatusBadge.classList.toggle('online', isOnline);
    DOM.syncStatusText.textContent = statusText;
    if (DOM.firebaseStatusLabel) {
      DOM.firebaseStatusLabel.textContent = statusText;
    }
  });

  // 載入設定
  AppState.settings = await FirebaseService.getSettings();
  applySettingsToUI();

  // 監聽交易明細
  FirebaseService.subscribeTransactions((txns) => {
    // 檢查是否有新存入交易以觸發金幣音效與慶祝
    if (AppState.transactions.length > 0 && txns.length > AppState.transactions.length) {
      const latest = txns[0];
      if (latest && (latest.type === 'deposit' || latest.type === 'reward' || latest.type === 'interest')) {
        SoundEffects.playCoin();
        if (window.confettiManager) window.confettiManager.shoot(45);
      }
    }

    AppState.transactions = txns;
    renderPassbook();
    renderGoals();
    renderStats();
    updateInterestCalculation();
  });

  // 監聽願望清單
  FirebaseService.subscribeGoals((goals) => {
    AppState.goals = goals;
    renderGoals();
    renderStats();
  });

  // ==================== 頁籤切換 ====================
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.dataset.tab;
      AppState.activeTab = tabTarget;

      DOM.tabBtns.forEach(b => b.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab${tabTarget.charAt(0).toUpperCase() + tabTarget.slice(1)}`).classList.add('active');
    });
  });

  // ==================== 類別過濾 ====================
  DOM.filterTxnCategory.addEventListener('change', (e) => {
    AppState.filterCategory = e.target.value;
    renderPassbook();
  });

  // ==================== 餘額隱藏切換 ====================
  DOM.btnToggleBalanceMask.addEventListener('click', () => {
    AppState.isBalanceMasked = !AppState.isBalanceMasked;
    DOM.eyeIcon.className = AppState.isBalanceMasked ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    renderBalanceDisplay();
  });

  // ==================== 音效切換 ====================
  DOM.btnToggleSound.addEventListener('click', () => {
    SoundEffects.enabled = !SoundEffects.enabled;
    DOM.soundIcon.className = SoundEffects.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  });

  // ==================== 家長管理驗證 (PIN Keypad) ====================
  DOM.btnParentAdmin.addEventListener('click', () => {
    if (AppState.isAdmin) {
      // 已經登入，直接打開後台
      openAdminModal();
    } else {
      openPinModal();
    }
  });

  DOM.btnQuickAddDeposit.addEventListener('click', () => {
    if (AppState.isAdmin) {
      openAdminModal('record');
    } else {
      openPinModal(() => openAdminModal('record'));
    }
  });

  let onPinSuccessCallback = null;

  function openPinModal(onSuccess) {
    AppState.enteredPin = '';
    onPinSuccessCallback = onSuccess || (() => openAdminModal());
    updatePinDots();
    DOM.pinErrorMsg.style.display = 'none';
    DOM.pinModal.classList.add('active');
  }

  function handlePinInput(digit) {
    if (AppState.enteredPin.length < 4) {
      AppState.enteredPin += digit;
      updatePinDots();

      if (AppState.enteredPin.length === 4) {
        setTimeout(verifyPin, 150);
      }
    }
  }

  function updatePinDots() {
    DOM.pinDots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < AppState.enteredPin.length);
    });
  }

  function verifyPin() {
    const expectedPin = AppState.settings.parentPin || '1234';
    if (AppState.enteredPin === expectedPin) {
      AppState.isAdmin = true;
      DOM.pinModal.classList.remove('active');
      DOM.adminBtnLabel.textContent = '家長管理中心 (已驗證)';
      SoundEffects.playFanfare();
      if (onPinSuccessCallback) {
        onPinSuccessCallback();
        onPinSuccessCallback = null;
      }
    } else {
      DOM.pinErrorMsg.style.display = 'block';
      AppState.enteredPin = '';
      updatePinDots();
    }
  }

  DOM.pinKeypadBtns.forEach(btn => {
    btn.addEventListener('click', () => handlePinInput(btn.dataset.key));
  });

  DOM.btnPinClear.addEventListener('click', () => {
    AppState.enteredPin = '';
    updatePinDots();
    DOM.pinErrorMsg.style.display = 'none';
  });

  DOM.btnPinBackspace.addEventListener('click', () => {
    AppState.enteredPin = AppState.enteredPin.slice(0, -1);
    updatePinDots();
    DOM.pinErrorMsg.style.display = 'none';
  });

  // 實體鍵盤支援
  window.addEventListener('keydown', (e) => {
    if (DOM.pinModal.classList.contains('active')) {
      if (e.key >= '0' && e.key <= '9') {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        AppState.enteredPin = AppState.enteredPin.slice(0, -1);
        updatePinDots();
      } else if (e.key === 'Escape') {
        DOM.pinModal.classList.remove('active');
      }
    }
  });

  // ==================== 後台彈窗與分頁切換 ====================
  function openAdminModal(tabName = 'record') {
    DOM.adminModal.classList.add('active');
    switchAdminTab(tabName);
    updateInterestCalculation();
  }

  function switchAdminTab(tabKey) {
    DOM.adminNavBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.adminTab === tabKey);
    });
    DOM.adminTabPanes.forEach(p => {
      p.classList.toggle('active', p.id === `adminPane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}` || 
        p.id === `adminPanePassbookSettings` && tabKey === 'passbook-settings' ||
        p.id === `adminPaneFirebaseSettings` && tabKey === 'firebase-settings');
    });
  }

  DOM.adminNavBtns.forEach(btn => {
    btn.addEventListener('click', () => switchAdminTab(btn.dataset.adminTab));
  });

  // 關閉所有彈窗
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // ==================== 快捷標籤點擊填入 ====================
  DOM.quickCategoryTags.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    DOM.txnCategory.value = btn.dataset.cat;
    DOM.txnType.value = btn.dataset.type;
  });

  // ==================== 記帳表單送出 ====================
  DOM.formAddTransaction.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = DOM.txnType.value;
    const amount = parseFloat(DOM.txnAmount.value);
    const category = DOM.txnCategory.value.trim();
    const date = DOM.txnDate.value;
    const note = DOM.txnNote.value.trim();

    if (!amount || amount <= 0 || !category || !date) {
      alert("請填寫完整的金額與項目名稱！");
      return;
    }

    const newTxn = {
      type,
      amount,
      category,
      date,
      note
    };

    await FirebaseService.addTransaction(newTxn);
    
    // 清空表單並關閉彈窗
    DOM.txnAmount.value = '';
    DOM.txnNote.value = '';
    DOM.adminModal.classList.remove('active');

    SoundEffects.playCoin();
    if (window.confettiManager) window.confettiManager.shoot(50);
  });

  // ==================== 發放利息 (年利率制) ====================
  function updateInterestCalculation() {
    const totalBalance = calculateTotalBalance();
    const annualRate = parseFloat(DOM.interestRate.value) || 5;
    const period = DOM.interestPeriod.value || 'monthly';
    
    // 全年利息
    const annualInterest = Math.round(totalBalance * (annualRate / 100));
    // 本期應發利息
    let periodInterest = 0;
    if (period === 'monthly') {
      periodInterest = Math.round(annualInterest / 12);
    } else {
      periodInterest = annualInterest;
    }

    DOM.calcBaseBalance.textContent = totalBalance.toLocaleString();
    if (DOM.calcAnnualInterest) {
      DOM.calcAnnualInterest.textContent = annualInterest.toLocaleString();
    }
    DOM.calcInterestAmount.textContent = periodInterest.toLocaleString();
  }

  DOM.interestRate.addEventListener('input', updateInterestCalculation);
  DOM.interestPeriod.addEventListener('change', updateInterestCalculation);

  DOM.btnPayInterest.addEventListener('click', async () => {
    const totalBalance = calculateTotalBalance();
    const annualRate = parseFloat(DOM.interestRate.value) || 5;
    const period = DOM.interestPeriod.value || 'monthly';
    
    const annualInterest = Math.round(totalBalance * (annualRate / 100));
    let periodInterest = 0;
    let periodName = '';

    if (period === 'monthly') {
      periodInterest = Math.round(annualInterest / 12);
      const d = new Date();
      periodName = `${d.getFullYear()}年${d.getMonth() + 1}月份利息 (年利率 ${annualRate}%)`;
    } else {
      periodInterest = annualInterest;
      const d = new Date();
      periodName = `${d.getFullYear()}年度結算利息 (年利率 ${annualRate}%)`;
    }

    if (periodInterest <= 0) {
      alert("目前結存金額試算後的利息未達 1 元喔！請先存入更多成長基金。");
      return;
    }

    const newTxn = {
      type: 'interest',
      amount: periodInterest,
      category: '儲蓄利息獎勵',
      date: todayStr,
      note: periodName
    };

    await FirebaseService.addTransaction(newTxn);
    DOM.adminModal.classList.remove('active');
    SoundEffects.playFanfare();
    if (window.confettiManager) window.confettiManager.shoot(70);
    alert(`🎉 恭喜！已成功為孩子存入 ${periodInterest} 元儲蓄利息！\n（${periodName}）`);
  });

  // ==================== Canva 封面與存摺設定儲存 ====================
  // 封面檔案選擇器 (轉換為 Base64 儲存)
  DOM.coverFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      DOM.settingsCoverPreview.style.backgroundImage = `url(${base64})`;
      DOM.settingsCoverPreview.textContent = '';
      AppState.settings.coverImage = base64;
    };
    reader.readAsDataURL(file);
  });

  DOM.coverUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      DOM.settingsCoverPreview.style.backgroundImage = `url(${url})`;
      DOM.settingsCoverPreview.textContent = '';
      AppState.settings.coverImage = url;
    }
  });

  DOM.btnResetCover.addEventListener('click', () => {
    AppState.settings.coverImage = '';
    DOM.coverFileInput.value = '';
    DOM.coverUrlInput.value = '';
    DOM.settingsCoverPreview.style.backgroundImage = '';
    DOM.settingsCoverPreview.textContent = '恢復預設';
  });

  DOM.formPassbookSettings.addEventListener('submit', async (e) => {
    e.preventDefault();
    AppState.settings.childName = DOM.settingChildName.value.trim() || '小寶貝';
    AppState.settings.accountNumber = DOM.settingAccountNumber.value.trim() || 'SAV-2026-8888';
    AppState.settings.passbookTitle = DOM.settingPassbookTitle.value.trim() || '寶貝的專屬電子存摺';
    AppState.settings.currency = DOM.settingCurrency.value.trim() || 'NT$';
    
    if (DOM.settingParentPin.value.trim()) {
      if (DOM.settingParentPin.value.trim().length === 4) {
        AppState.settings.parentPin = DOM.settingParentPin.value.trim();
      } else {
        alert("PIN 碼必須為 4 位數字！");
        return;
      }
    }

    await FirebaseService.saveSettings(AppState.settings);
    applySettingsToUI();
    DOM.adminModal.classList.remove('active');
    alert("✅ 存摺設定與封面已成功儲存！");
  });

  function applySettingsToUI() {
    const s = AppState.settings;
    DOM.headerTitle.textContent = s.passbookTitle || '寶貝的專屬電子存摺';
    DOM.displayChildName.textContent = s.childName || '親愛的小寶貝';
    DOM.displayAccountNumber.textContent = s.accountNumber || 'SAV-2026-8888';
    DOM.displayAccountOpenDate.textContent = s.openDate || '2026-01-01';
    DOM.displayCurrency.textContent = s.currency || 'NT$';
    DOM.defaultCoverTitle.textContent = s.passbookTitle || '夢想成長存摺';

    // 封面圖片套用
    if (s.coverImage) {
      DOM.passbookCoverImg.src = s.coverImage;
      DOM.passbookCoverImg.style.display = 'block';
      DOM.coverPlaceholder.style.display = 'none';
      DOM.settingsCoverPreview.style.backgroundImage = `url(${s.coverImage})`;
      DOM.settingsCoverPreview.textContent = '';
    } else {
      DOM.passbookCoverImg.src = '';
      DOM.passbookCoverImg.style.display = 'none';
      DOM.coverPlaceholder.style.display = 'flex';
      DOM.settingsCoverPreview.style.backgroundImage = '';
      DOM.settingsCoverPreview.textContent = '預設封面';
    }

    // 後台輸入框預填
    DOM.settingChildName.value = s.childName || '小寶貝';
    DOM.settingAccountNumber.value = s.accountNumber || 'SAV-2026-8888';
    DOM.settingPassbookTitle.value = s.passbookTitle || '寶貝的專屬電子存摺';
    DOM.settingCurrency.value = s.currency || 'NT$';
  }

  // ==================== Firebase Config 儲存與中斷 ====================
  const existingConfig = localStorage.getItem(DB_KEYS.FIREBASE_CONFIG);
  if (existingConfig) {
    try {
      DOM.firebaseConfigJson.value = JSON.stringify(JSON.parse(existingConfig), null, 2);
    } catch (e) {}
  }

  DOM.btnSaveFirebaseConfig.addEventListener('click', async () => {
    const val = DOM.firebaseConfigJson.value.trim();
    if (!val) {
      alert("請貼上 Firebase 設定 JSON 物件！");
      return;
    }
    const res = await FirebaseService.setConfig(val);
    if (!res.success) {
      alert("設定格式錯誤：" + res.error);
    }
  });

  DOM.btnDisconnectFirebase.addEventListener('click', () => {
    if (confirm("確定要中斷 Firebase 連線並改為本機離線模式嗎？")) {
      FirebaseService.disconnect();
    }
  });

  // ==================== 資料備份與復原 ====================
  DOM.btnExportJson.addEventListener('click', () => {
    FirebaseService.exportFullBackup();
  });

  DOM.btnTriggerImportJson.addEventListener('click', () => {
    DOM.importJsonInput.click();
  });

  DOM.importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await FirebaseService.importFullBackup(json);
        if (res.success) {
          alert("🎉 存摺資料已成功復原！即將重新載入。");
          window.location.reload();
        } else {
          alert("復原失敗：" + res.error);
        }
      } catch (err) {
        alert("讀取檔案失敗，請確認是否為有效的 JSON 備份檔！");
      }
    };
    reader.readAsText(file);
  });

  DOM.btnResetAllData.addEventListener('click', async () => {
    const answer = prompt("⚠️ 此操作會清除所有存款紀錄！如確定要重置，請輸入「確定清除」：");
    if (answer === '確定清除') {
      await FirebaseService.resetAll();
      window.location.reload();
    }
  });

  // ==================== 願望管理 (Goals) ====================
  DOM.btnOpenAddGoal.addEventListener('click', () => {
    DOM.goalModal.classList.add('active');
  });

  DOM.formAddGoal.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = DOM.goalTitle.value.trim();
    const targetAmount = parseFloat(DOM.goalTargetAmount.value);
    const icon = DOM.goalIcon.value;
    const note = DOM.goalNote.value.trim();

    if (!title || !targetAmount || targetAmount <= 0) {
      alert("請填寫願望名稱與目標金額！");
      return;
    }

    await FirebaseService.addGoal({
      title,
      targetAmount,
      icon,
      note
    });

    DOM.goalTitle.value = '';
    DOM.goalTargetAmount.value = '';
    DOM.goalNote.value = '';
    DOM.goalModal.classList.remove('active');

    SoundEffects.playFanfare();
    if (window.confettiManager) window.confettiManager.shoot(40);
  });

  // ==================== 渲染存摺明細與餘額計算 ====================
  function calculateTotalBalance() {
    // 依日期升序計算每筆流水後的結存
    const sortedAsc = [...AppState.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    sortedAsc.forEach(t => {
      if (t.type === 'deposit' || t.type === 'reward' || t.type === 'interest') {
        balance += Number(t.amount);
      } else if (t.type === 'withdraw') {
        balance -= Number(t.amount);
      }
    });
    return Math.max(0, balance);
  }

  function renderBalanceDisplay() {
    const total = calculateTotalBalance();
    if (AppState.isBalanceMasked) {
      DOM.displayTotalBalance.textContent = '****';
    } else {
      DOM.displayTotalBalance.textContent = total.toLocaleString();
    }

    // 鼓勵小語動態變化
    if (total === 0) {
      DOM.displayEncouragement.textContent = '🌱 每一枚小銅板，都在為未來的夢想施肥！';
    } else if (total < 500) {
      DOM.displayEncouragement.textContent = '✨ 哇！存錢小種子已經發芽囉，繼續加油！';
    } else if (total < 2000) {
      DOM.displayEncouragement.textContent = '🌟 太厲害了！你已經是一個自律的存錢小達人！';
    } else {
      DOM.displayEncouragement.textContent = '👑 哇塞！金庫滿滿！有計畫的儲蓄讓你離夢想更近！';
    }
  }

  function renderPassbook() {
    renderBalanceDisplay();

    // 依日期升序計算每筆交易當下的餘額
    const sortedAsc = [...AppState.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    const txnsWithBalance = sortedAsc.map(t => {
      if (t.type === 'deposit' || t.type === 'reward' || t.type === 'interest') {
        runningBalance += Number(t.amount);
      } else if (t.type === 'withdraw') {
        runningBalance -= Number(t.amount);
      }
      return {
        ...t,
        balanceAfter: Math.max(0, runningBalance)
      };
    });

    // 降序呈現給使用者 (最新的在最上面)
    const sortedDesc = txnsWithBalance.reverse();

    // 類別過濾
    const filtered = sortedDesc.filter(t => {
      if (AppState.filterCategory === 'all') return true;
      return t.type === AppState.filterCategory;
    });

    DOM.displayTxnCount.textContent = `共 ${filtered.length} 筆交易`;

    if (filtered.length === 0) {
      DOM.txnTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table-state">
            <div class="empty-box">
              <i class="fa-solid fa-feather-pointed"></i>
              <p>目前沒有符合條件的明細紀錄喔！</p>
              <small>點擊「家長記帳」存入第一筆成長基金吧 ✨</small>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    DOM.txnTableBody.innerHTML = filtered.map(t => {
      const isDeposit = t.type === 'deposit' || t.type === 'reward' || t.type === 'interest';
      const typeIcon = t.type === 'reward' ? '🌟' : (t.type === 'interest' ? '📈' : (t.type === 'withdraw' ? '🛒' : '💰'));
      
      return `
        <tr data-txn-id="${t.id}">
          <td class="txn-date">${t.date}</td>
          <td>
            <div class="txn-cat">
              <span>${typeIcon}</span>
              <span>${escapeHtml(t.category)}</span>
            </div>
          </td>
          <td class="txn-note">${escapeHtml(t.note || '-')}</td>
          <td class="txn-amount-in">${isDeposit ? `+${Number(t.amount).toLocaleString()}` : '-'}</td>
          <td class="txn-amount-out">${!isDeposit ? `-${Number(t.amount).toLocaleString()}` : '-'}</td>
          <td class="txn-balance">${Number(t.balanceAfter).toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    // 綁定行點擊事件（家長登入時可點擊刪除/管理）
    DOM.txnTableBody.querySelectorAll('tr[data-txn-id]').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.txnId;
        const txn = AppState.transactions.find(x => x.id === id);
        if (!txn) return;

        if (AppState.isAdmin) {
          AppState.selectedTxnForEdit = txn;
          DOM.editTxnInfoText.innerHTML = `
            <strong>日期：</strong>${txn.date}<br>
            <strong>項目：</strong>${escapeHtml(txn.category)}<br>
            <strong>金額：</strong>${txn.type === 'withdraw' ? '-' : '+'}${txn.amount} 元<br>
            <strong>備註：</strong>${escapeHtml(txn.note || '無')}
          `;
          DOM.editTxnModal.classList.add('active');
        } else {
          // 未登入家長模式時，引導輸入 PIN
          openPinModal(() => {
            AppState.selectedTxnForEdit = txn;
            DOM.editTxnInfoText.innerHTML = `
              <strong>日期：</strong>${txn.date}<br>
              <strong>項目：</strong>${escapeHtml(txn.category)}<br>
              <strong>金額：</strong>${txn.type === 'withdraw' ? '-' : '+'}${txn.amount} 元<br>
              <strong>備註：</strong>${escapeHtml(txn.note || '無')}
            `;
            DOM.editTxnModal.classList.add('active');
          });
        }
      });
    });
  }

  // 刪除單筆交易
  DOM.btnDeleteTxn.addEventListener('click', async () => {
    if (!AppState.selectedTxnForEdit) return;
    if (confirm("確定要刪除這筆交易紀錄嗎？")) {
      await FirebaseService.deleteTransaction(AppState.selectedTxnForEdit.id);
      DOM.editTxnModal.classList.remove('active');
      AppState.selectedTxnForEdit = null;
    }
  });

  // ==================== 渲染願望目標 ====================
  function renderGoals() {
    const totalBalance = calculateTotalBalance();
    DOM.goalsCountBadge.textContent = AppState.goals.length;

    if (AppState.goals.length === 0) {
      DOM.goalsListGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 10px;"></i>
          <p style="font-weight: 600;">還沒有設定任何儲蓄目標喔！</p>
          <p style="font-size: 0.85rem;">點擊右上角「新增願望目標」，和孩子一起許下第一個存錢夢想吧！</p>
        </div>
      `;
      return;
    }

    DOM.goalsListGrid.innerHTML = AppState.goals.map(g => {
      const target = Number(g.targetAmount);
      const percent = Math.min(100, Math.round((totalBalance / target) * 100));
      const remaining = Math.max(0, target - totalBalance);
      const isAchieved = totalBalance >= target || g.completed;

      return `
        <div class="goal-card ${g.completed ? 'completed' : ''}" data-goal-id="${g.id}">
          <div class="goal-top-row">
            <div class="goal-icon-badge">${g.icon || '🎯'}</div>
            <div class="goal-meta">
              <div class="goal-name">${escapeHtml(g.title)}</div>
              <div class="goal-amount">目標：${AppState.settings.currency || 'NT$'} ${target.toLocaleString()}</div>
            </div>
          </div>

          ${g.note ? `<p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">💭 ${escapeHtml(g.note)}</p>` : ''}

          <div class="goal-progress-wrap">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="goal-progress-stats">
              <span>進度 ${percent}%</span>
              <span>${isAchieved ? '🎉 已達成！' : `還差 $${remaining.toLocaleString()}`}</span>
            </div>
          </div>

          <div class="goal-actions">
            ${isAchieved && !g.completed ? `
              <button class="btn btn-accent btn-sm btn-block btn-achieve-goal" data-id="${g.id}">
                <i class="fa-solid fa-gift"></i> 標記為已實現！
              </button>
            ` : ''}
            ${g.completed ? `
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--success); display: flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-circle-check"></i> 願望已實現！
              </span>
            ` : ''}
            <button class="btn btn-outline btn-sm btn-delete-goal" data-id="${g.id}" title="刪除此願望" style="margin-left: auto;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 綁定願望按鈕事件
    DOM.goalsListGrid.querySelectorAll('.btn-achieve-goal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await FirebaseService.toggleGoalComplete(id, true);
        SoundEffects.playFanfare();
        if (window.confettiManager) window.confettiManager.shoot(80);
      });
    });

    DOM.goalsListGrid.querySelectorAll('.btn-delete-goal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm("確定要刪除這個願望目標嗎？")) {
          await FirebaseService.deleteGoal(id);
        }
      });
    });
  }

  // ==================== 渲染成長統計 ====================
  function renderStats() {
    let totalDeposits = 0;
    let totalWithdraws = 0;
    let totalRewards = 0;
    const catMap = {};

    AppState.transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'deposit') {
        totalDeposits += amt;
      } else if (t.type === 'withdraw') {
        totalWithdraws += amt;
      } else if (t.type === 'reward' || t.type === 'interest') {
        totalRewards += amt;
      }

      if (t.type !== 'withdraw') {
        const cat = t.category || '一般存款';
        catMap[cat] = (catMap[cat] || 0) + amt;
      }
    });

    const currency = AppState.settings.currency || 'NT$';
    DOM.statTotalDeposits.textContent = `${currency} ${totalDeposits.toLocaleString()}`;
    DOM.statTotalWithdraws.textContent = `${currency} ${totalWithdraws.toLocaleString()}`;
    DOM.statTotalRewards.textContent = `${currency} ${totalRewards.toLocaleString()}`;
    
    const completedCount = AppState.goals.filter(g => g.completed).length;
    DOM.statCompletedGoals.textContent = `${completedCount} 個`;

    // 收入分類條
    const totalIncome = totalDeposits + totalRewards;
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    if (totalIncome === 0 || catEntries.length === 0) {
      DOM.categoryBars.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">尚無足夠數據產生長條圖</p>';
      return;
    }

    DOM.categoryBars.innerHTML = catEntries.map(([catName, amt]) => {
      const pct = Math.round((amt / totalIncome) * 100);
      return `
        <div class="category-bar-item">
          <div class="category-bar-label">
            <span>${escapeHtml(catName)}</span>
            <span>${currency} ${amt.toLocaleString()} (${pct}%)</span>
          </div>
          <div class="category-bar-track">
            <div class="category-bar-progress" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 工具函式
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
