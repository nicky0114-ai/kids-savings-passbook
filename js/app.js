/**
 * 兒童專屬成長電子存摺 - 主應用邏輯 (支援多孩童帳戶管理)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 狀態管理
  const AppState = {
    accounts: [],
    currentAccountId: null,
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
    
    // 孩子切換列
    childPillsList: document.getElementById('childPillsList'),
    btnQuickAddChild: document.getElementById('btnQuickAddChild'),

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
    
    // 記帳面板
    formAddTransaction: document.getElementById('formAddTransaction'),
    txnChildSelect: document.getElementById('txnChildSelect'),
    txnType: document.getElementById('txnType'),
    txnAmount: document.getElementById('txnAmount'),
    txnCategory: document.getElementById('txnCategory'),
    txnDate: document.getElementById('txnDate'),
    txnNote: document.getElementById('txnNote'),
    quickCategoryTags: document.getElementById('quickCategoryTags'),

    // 孩子帳戶管理面板
    childrenCardsList: document.getElementById('childrenCardsList'),
    btnOpenAddChildModal: document.getElementById('btnOpenAddChildModal'),

    // 孩子新增/編輯彈窗
    childModal: document.getElementById('childModal'),
    childModalTitle: document.getElementById('childModalTitle'),
    formAddEditChild: document.getElementById('formAddEditChild'),
    childFormId: document.getElementById('childFormId'),
    childFormName: document.getElementById('childFormName'),
    childFormAvatar: document.getElementById('childFormAvatar'),
    childFormAccountNum: document.getElementById('childFormAccountNum'),
    childFormInitDeposit: document.getElementById('childFormInitDeposit'),
    childFormTitle: document.getElementById('childFormTitle'),
    btnSubmitChildForm: document.getElementById('btnSubmitChildForm'),

    // 利息面板
    interestChildSelect: document.getElementById('interestChildSelect'),
    interestRate: document.getElementById('interestRate'),
    interestPeriod: document.getElementById('interestPeriod'),
    calcBaseBalance: document.getElementById('calcBaseBalance'),
    calcAnnualInterest: document.getElementById('calcAnnualInterest'),
    calcInterestAmount: document.getElementById('calcInterestAmount'),
    btnPayInterest: document.getElementById('btnPayInterest'),

    // 封面與存摺設定
    formPassbookSettings: document.getElementById('formPassbookSettings'),
    settingChildSelect: document.getElementById('settingChildSelect'),
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
    goalChildSelect: document.getElementById('goalChildSelect'),
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

  // 1. 初始化 Firebase 與狀態監聽
  await FirebaseService.init((isOnline, statusText) => {
    DOM.syncStatusBadge.classList.toggle('online', isOnline);
    DOM.syncStatusText.textContent = statusText;
    if (DOM.firebaseStatusLabel) {
      DOM.firebaseStatusLabel.textContent = statusText;
    }
  });

  // 2. 監聽帳戶列表 (Accounts)
  FirebaseService.subscribeAccounts((accounts) => {
    AppState.accounts = accounts;
    
    // 若尚未指定當前帳戶，從網址參數 ?child=... 或預設第一個帳戶載入
    if (!AppState.currentAccountId && accounts.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetParam = urlParams.get('child');
      
      let matched = null;
      if (targetParam) {
        matched = accounts.find(a => a.id === targetParam || a.accountNumber === targetParam || a.childName === targetParam);
      }
      AppState.currentAccountId = matched ? matched.id : accounts[0].id;
    }

    renderChildPills();
    updateChildDropdowns();
    renderCurrentAccountUI();
    renderPassbook();
    renderGoals();
    renderStats();
    renderChildrenManagerList();
    updateInterestCalculation();
  });

  // 3. 監聽交易明細 (Transactions)
  FirebaseService.subscribeTransactions((txns) => {
    // 檢查是否有新存入交易以觸發金幣音效與慶祝
    if (AppState.transactions.length > 0 && txns.length > AppState.transactions.length) {
      const latest = txns[0];
      if (latest && latest.accountId === AppState.currentAccountId && (latest.type === 'deposit' || latest.type === 'reward' || latest.type === 'interest')) {
        SoundEffects.playCoin();
        if (window.confettiManager) window.confettiManager.shoot(45);
      }
    }

    AppState.transactions = txns;
    renderPassbook();
    renderGoals();
    renderStats();
    renderChildrenManagerList();
    updateInterestCalculation();
  });

  // 4. 監聽願望清單 (Goals)
  FirebaseService.subscribeGoals((goals) => {
    AppState.goals = goals;
    renderGoals();
    renderStats();
  });

  // ==================== 孩子帳戶切換與渲染 ====================
  function getCurrentAccount() {
    return AppState.accounts.find(a => a.id === AppState.currentAccountId) || AppState.accounts[0] || {
      childName: '小寶貝',
      avatar: '👦',
      accountNumber: 'SAV-2026-8888',
      passbookTitle: '寶貝的專屬電子存摺',
      currency: 'NT$',
      openDate: '2026-01-01',
      coverImage: ''
    };
  }

  function switchAccount(accountId) {
    AppState.currentAccountId = accountId;
    renderChildPills();
    renderCurrentAccountUI();
    renderPassbook();
    renderGoals();
    renderStats();
    updateInterestCalculation();
    syncDropdownSelection(accountId);
  }

  function renderChildPills() {
    if (!DOM.childPillsList) return;
    DOM.childPillsList.innerHTML = AppState.accounts.map(acc => {
      const isActive = acc.id === AppState.currentAccountId;
      return `
        <button class="child-pill-btn ${isActive ? 'active' : ''}" data-account-id="${acc.id}">
          <span class="child-pill-avatar">${acc.avatar || '👦'}</span>
          <span>${escapeHtml(acc.childName)}</span>
        </button>
      `;
    }).join('');

    DOM.childPillsList.querySelectorAll('.child-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchAccount(btn.dataset.accountId);
      });
    });
  }

  function updateChildDropdowns() {
    const optionsHtml = AppState.accounts.map(acc => 
      `<option value="${acc.id}">${acc.avatar || '👦'} ${escapeHtml(acc.childName)} (${acc.accountNumber})</option>`
    ).join('');

    if (DOM.txnChildSelect) DOM.txnChildSelect.innerHTML = optionsHtml;
    if (DOM.interestChildSelect) DOM.interestChildSelect.innerHTML = optionsHtml;
    if (DOM.settingChildSelect) DOM.settingChildSelect.innerHTML = optionsHtml;
    if (DOM.goalChildSelect) DOM.goalChildSelect.innerHTML = optionsHtml;

    syncDropdownSelection(AppState.currentAccountId);
  }

  function syncDropdownSelection(accountId) {
    if (!accountId) return;
    if (DOM.txnChildSelect) DOM.txnChildSelect.value = accountId;
    if (DOM.interestChildSelect) DOM.interestChildSelect.value = accountId;
    if (DOM.goalChildSelect) DOM.goalChildSelect.value = accountId;
    if (DOM.settingChildSelect) {
      DOM.settingChildSelect.value = accountId;
      loadAccountSettingsToForm(accountId);
    }
  }

  function renderCurrentAccountUI() {
    const acc = getCurrentAccount();
    DOM.headerTitle.textContent = acc.passbookTitle || `${acc.childName}的專屬電子存摺`;
    DOM.displayChildName.textContent = acc.childName || '親愛的小寶貝';
    DOM.displayAccountNumber.textContent = acc.accountNumber || 'SAV-2026-8888';
    DOM.displayAccountOpenDate.textContent = acc.openDate || '2026-01-01';
    DOM.displayCurrency.textContent = acc.currency || 'NT$';
    DOM.defaultCoverTitle.textContent = acc.passbookTitle || `${acc.childName}的夢想成長存摺`;

    // 封面圖片套用
    if (acc.coverImage) {
      DOM.passbookCoverImg.src = acc.coverImage;
      DOM.passbookCoverImg.style.display = 'block';
      DOM.coverPlaceholder.style.display = 'none';
    } else {
      DOM.passbookCoverImg.src = '';
      DOM.passbookCoverImg.style.display = 'none';
      DOM.coverPlaceholder.style.display = 'flex';
    }
  }

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

  // 類別過濾
  DOM.filterTxnCategory.addEventListener('change', (e) => {
    AppState.filterCategory = e.target.value;
    renderPassbook();
  });

  // 餘額隱藏切換
  DOM.btnToggleBalanceMask.addEventListener('click', () => {
    AppState.isBalanceMasked = !AppState.isBalanceMasked;
    DOM.eyeIcon.className = AppState.isBalanceMasked ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    renderBalanceDisplay();
  });

  // 音效切換
  DOM.btnToggleSound.addEventListener('click', () => {
    SoundEffects.enabled = !SoundEffects.enabled;
    DOM.soundIcon.className = SoundEffects.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  });

  // ==================== 家長管理驗證 (PIN Keypad) ====================
  DOM.btnParentAdmin.addEventListener('click', () => {
    if (AppState.isAdmin) {
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

  DOM.btnQuickAddChild.addEventListener('click', () => {
    if (AppState.isAdmin) {
      openAddChildModal();
    } else {
      openPinModal(() => openAddChildModal());
    }
  });

  DOM.btnOpenAddChildModal.addEventListener('click', () => {
    openAddChildModal();
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
    const currentAcc = getCurrentAccount();
    const expectedPin = currentAcc.parentPin || '1234';
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
    updateChildDropdowns();
    updateInterestCalculation();
  }

  function switchAdminTab(tabKey) {
    DOM.adminNavBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.adminTab === tabKey);
    });
    DOM.adminTabPanes.forEach(p => {
      p.classList.toggle('active', 
        p.id === `adminPane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}` || 
        p.id === `adminPanePassbookSettings` && tabKey === 'passbook-settings' ||
        p.id === `adminPaneFirebaseSettings` && tabKey === 'firebase-settings' ||
        p.id === `adminPaneChildren` && tabKey === 'children'
      );
    });
  }

  DOM.adminNavBtns.forEach(btn => {
    btn.addEventListener('click', () => switchAdminTab(btn.dataset.adminTab));
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentModal = btn.closest('.modal-overlay');
      if (parentModal) {
        parentModal.classList.remove('active');
      } else {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      }
    });
  });

  // 快捷標籤
  DOM.quickCategoryTags.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    DOM.txnCategory.value = btn.dataset.cat;
    DOM.txnType.value = btn.dataset.type;
  });

  // ==================== 記帳送出 (支援指定孩子) ====================
  DOM.formAddTransaction.addEventListener('submit', async (e) => {
    e.preventDefault();
    const accountId = (DOM.txnChildSelect && DOM.txnChildSelect.value) ? DOM.txnChildSelect.value : (AppState.currentAccountId || AppState.accounts[0]?.id || 'child_default');
    const type = DOM.txnType.value || 'deposit';
    const amount = parseFloat(DOM.txnAmount.value);
    const category = DOM.txnCategory.value.trim() || '存款成長基金';
    const date = DOM.txnDate.value || todayStr;
    const note = DOM.txnNote.value.trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      alert("請輸入大於 0 的正確金額！");
      return;
    }

    const newTxn = {
      accountId,
      type,
      amount,
      category,
      date,
      note
    };

    try {
      const savedTxn = await FirebaseService.addTransaction(newTxn);

      // 立即推入 AppState.transactions
      const exists = AppState.transactions.some(t => t.id === savedTxn.id);
      if (!exists) {
        AppState.transactions.unshift(savedTxn);
      }

      DOM.txnAmount.value = '';
      DOM.txnNote.value = '';
      DOM.adminModal.classList.remove('active');

      // 若記帳對象與目前檢視的不同，自動切換
      if (accountId !== AppState.currentAccountId) {
        switchAccount(accountId);
      } else {
        renderPassbook();
        renderStats();
        renderChildrenManagerList();
        updateInterestCalculation();
      }

      SoundEffects.playCoin();
      if (window.confettiManager) window.confettiManager.shoot(50);
      alert(`🎉 成功存入 ${amount} 元！已記錄至存摺。`);
    } catch (err) {
      console.error("記帳存入失敗:", err);
      alert("存入失敗：" + err.message);
    }
  });

  // ==================== 孩子帳戶管理 (CRUD) ====================
  function renderChildrenManagerList() {
    if (!DOM.childrenCardsList) return;

    const baseUrl = window.location.origin + window.location.pathname;

    DOM.childrenCardsList.innerHTML = AppState.accounts.map(acc => {
      const balance = calculateAccountBalance(acc.id);
      const directUrl = `${baseUrl}?child=${encodeURIComponent(acc.accountNumber || acc.id)}`;
      const isActive = acc.id === AppState.currentAccountId;

      return `
        <div class="child-account-card ${isActive ? 'active' : ''}">
          <div class="child-card-top">
            <div class="child-card-avatar">${acc.avatar || '👦'}</div>
            <div class="child-card-info">
              <div class="child-card-name">${escapeHtml(acc.childName)} ${isActive ? '<span style="font-size:0.75rem; color:var(--primary); font-weight:700;">(目前檢視)</span>' : ''}</div>
              <div class="child-card-account">帳號：${escapeHtml(acc.accountNumber)}</div>
            </div>
          </div>

          <div class="child-card-balance-box">
            <span class="child-card-balance-label">結存金額</span>
            <span class="child-card-balance-val">${acc.currency || 'NT$'} ${balance.toLocaleString()}</span>
          </div>

          <div class="child-direct-link-box">
            <span class="child-direct-link-text" title="${directUrl}">專屬網址: ?child=${acc.accountNumber}</span>
            <button type="button" class="btn btn-outline btn-sm btn-copy-direct-url" data-url="${directUrl}">
              <i class="fa-solid fa-copy"></i> 複製
            </button>
          </div>

          <div class="child-card-actions">
            <button type="button" class="btn btn-primary btn-sm btn-select-child-card" data-id="${acc.id}">
              <i class="fa-solid fa-book-open"></i> 開啟存摺
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-edit-child-card" data-id="${acc.id}">
              <i class="fa-solid fa-pen"></i> 編輯
            </button>
            ${AppState.accounts.length > 1 ? `
              <button type="button" class="btn btn-danger btn-sm btn-delete-child-card" data-id="${acc.id}" title="刪除此存摺">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // 綁定卡片按鈕事件
    DOM.childrenCardsList.querySelectorAll('.btn-copy-direct-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.url).then(() => {
          alert("📋 孩子的專屬查帳網址已複製！\n可直接貼在孩子的平板或手機瀏覽器中開啟。");
        });
      });
    });

    DOM.childrenCardsList.querySelectorAll('.btn-select-child-card').forEach(btn => {
      btn.addEventListener('click', () => {
        switchAccount(btn.dataset.id);
        DOM.adminModal.classList.remove('active');
      });
    });

    DOM.childrenCardsList.querySelectorAll('.btn-edit-child-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const acc = AppState.accounts.find(a => a.id === btn.dataset.id);
        if (acc) openEditChildModal(acc);
      });
    });

    DOM.childrenCardsList.querySelectorAll('.btn-delete-child-card').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const acc = AppState.accounts.find(a => a.id === id);
        if (confirm(`確定要刪除「${acc ? acc.childName : '此孩子'}」的專屬存摺帳戶嗎？`)) {
          await FirebaseService.deleteAccount(id);
          AppState.accounts = AppState.accounts.filter(a => a.id !== id);
          if (AppState.currentAccountId === id) {
            AppState.currentAccountId = AppState.accounts[0]?.id || null;
          }
          renderChildPills();
          updateChildDropdowns();
          renderChildrenManagerList();
          renderCurrentAccountUI();
          renderPassbook();
          renderGoals();
          renderStats();
        }
      });
    });
  }

  function openAddChildModal() {
    DOM.childFormId.value = '';
    DOM.childModalTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> 新增孩子專屬存摺';
    DOM.childFormName.value = '';
    DOM.childFormAvatar.value = '👧';
    DOM.childFormAccountNum.value = `SAV-2026-${String(AppState.accounts.length + 1).padStart(4, '0')}`;
    DOM.childFormInitDeposit.value = '0';
    if (DOM.childFormInitDeposit.parentElement) {
      DOM.childFormInitDeposit.parentElement.style.display = 'block';
    }
    DOM.childFormTitle.value = '';
    DOM.btnSubmitChildForm.innerHTML = '<i class="fa-solid fa-check"></i> 建立專屬存摺';
    DOM.btnSubmitChildForm.disabled = false;

    DOM.childModal.classList.add('active');
  }

  function openEditChildModal(acc) {
    DOM.childFormId.value = acc.id;
    DOM.childModalTitle.innerHTML = '<i class="fa-solid fa-pen"></i> 編輯孩子存摺資料';
    DOM.childFormName.value = acc.childName || '';
    DOM.childFormAvatar.value = acc.avatar || '👦';
    DOM.childFormAccountNum.value = acc.accountNumber || '';
    DOM.childFormInitDeposit.value = '0';
    if (DOM.childFormInitDeposit.parentElement) {
      DOM.childFormInitDeposit.parentElement.style.display = 'none'; // 編輯時隱藏開戶金額
    }
    DOM.childFormTitle.value = acc.passbookTitle || '';
    DOM.btnSubmitChildForm.innerHTML = '<i class="fa-solid fa-check"></i> 儲存修改';
    DOM.btnSubmitChildForm.disabled = false;

    DOM.childModal.classList.add('active');
  }

  DOM.formAddEditChild.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.childFormId.value;
    const name = DOM.childFormName.value.trim();
    const avatar = DOM.childFormAvatar.value;
    const accountNum = DOM.childFormAccountNum.value.trim();
    const title = DOM.childFormTitle.value.trim() || `${name}的專屬成長存摺`;
    const initDeposit = parseFloat(DOM.childFormInitDeposit.value) || 0;

    if (!name || !accountNum) {
      alert("請填寫孩子姓名與帳號！");
      return;
    }

    DOM.btnSubmitChildForm.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 儲存中...';
    DOM.btnSubmitChildForm.disabled = true;

    try {
      let accountObj = null;
      if (id) {
        // 編輯
        const existing = AppState.accounts.find(a => a.id === id);
        accountObj = {
          ...existing,
          childName: name,
          avatar,
          accountNumber: accountNum,
          passbookTitle: title
        };
        const saved = await FirebaseService.saveAccount(accountObj);
        const idx = AppState.accounts.findIndex(a => a.id === id);
        if (idx >= 0) AppState.accounts[idx] = saved;
      } else {
        // 新增
        const newAccId = 'child_' + Date.now();
        accountObj = {
          id: newAccId,
          childName: name,
          avatar,
          accountNumber: accountNum,
          passbookTitle: title,
          currency: 'NT$',
          parentPin: '1234',
          openDate: todayStr,
          coverImage: '',
          annualInterestRate: 5
        };
        const saved = await FirebaseService.saveAccount(accountObj);
        AppState.accounts.push(saved);

        // 若有開戶金額，寫入開戶存款
        if (initDeposit > 0) {
          await FirebaseService.addTransaction({
            accountId: newAccId,
            type: 'deposit',
            amount: initDeposit,
            category: '開戶成長基金',
            date: todayStr,
            note: '開戶存入的第一筆夢想種子 🌱'
          });
        }

        AppState.currentAccountId = newAccId;
      }

      // 立即刷新所有畫面元件
      renderChildPills();
      updateChildDropdowns();
      renderChildrenManagerList();
      renderCurrentAccountUI();
      renderPassbook();
      renderGoals();
      renderStats();
      updateInterestCalculation();

      DOM.childModal.classList.remove('active');
      SoundEffects.playFanfare();
      if (window.confettiManager) window.confettiManager.shoot(60);
      alert(`🎉 恭喜！「${name}」的專屬存摺已建立完成！`);
    } catch (err) {
      console.error("建立孩子存摺失敗:", err);
      alert("儲存失敗：" + err.message);
    } finally {
      DOM.btnSubmitChildForm.disabled = false;
    }
  });

  // ==================== 發放年利息 (支援指定孩子) ====================
  function updateInterestCalculation() {
    const targetAccountId = DOM.interestChildSelect ? DOM.interestChildSelect.value || AppState.currentAccountId : AppState.currentAccountId;
    const totalBalance = calculateAccountBalance(targetAccountId);
    const annualRate = parseFloat(DOM.interestRate.value) || 5;
    const period = DOM.interestPeriod.value || 'monthly';
    
    const annualInterest = Math.round(totalBalance * (annualRate / 100));
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
  if (DOM.interestChildSelect) {
    DOM.interestChildSelect.addEventListener('change', updateInterestCalculation);
  }

  DOM.btnPayInterest.addEventListener('click', async () => {
    const targetAccountId = DOM.interestChildSelect ? DOM.interestChildSelect.value || AppState.currentAccountId : AppState.currentAccountId;
    const targetAcc = AppState.accounts.find(a => a.id === targetAccountId) || getCurrentAccount();
    const totalBalance = calculateAccountBalance(targetAccountId);
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
      accountId: targetAccountId,
      type: 'interest',
      amount: periodInterest,
      category: '儲蓄利息獎勵',
      date: todayStr,
      note: periodName
    };

    const savedTxn = await FirebaseService.addTransaction(newTxn);
    const exists = AppState.transactions.some(t => t.id === savedTxn.id);
    if (!exists) {
      AppState.transactions.unshift(savedTxn);
    }

    DOM.adminModal.classList.remove('active');
    
    if (targetAccountId !== AppState.currentAccountId) {
      switchAccount(targetAccountId);
    } else {
      renderPassbook();
      renderStats();
      renderChildrenManagerList();
      updateInterestCalculation();
    }

    SoundEffects.playFanfare();
    if (window.confettiManager) window.confettiManager.shoot(70);
    alert(`🎉 恭喜！已成功為【${targetAcc.childName}】存入 ${periodInterest} 元儲蓄利息！\n（${periodName}）`);
  });

  // ==================== Canva 封面與存摺設定儲存 ====================
  if (DOM.settingChildSelect) {
    DOM.settingChildSelect.addEventListener('change', (e) => {
      loadAccountSettingsToForm(e.target.value);
    });
  }

  function loadAccountSettingsToForm(accountId) {
    const acc = AppState.accounts.find(a => a.id === accountId) || getCurrentAccount();
    DOM.settingChildName.value = acc.childName || '小寶貝';
    DOM.settingAccountNumber.value = acc.accountNumber || 'SAV-2026-8888';
    DOM.settingPassbookTitle.value = acc.passbookTitle || '寶貝的專屬電子存摺';
    DOM.settingCurrency.value = acc.currency || 'NT$';

    if (acc.coverImage) {
      DOM.settingsCoverPreview.style.backgroundImage = `url(${acc.coverImage})`;
      DOM.settingsCoverPreview.textContent = '';
    } else {
      DOM.settingsCoverPreview.style.backgroundImage = '';
      DOM.settingsCoverPreview.textContent = '預設封面';
    }
  }

  // 封面檔案選擇器 (轉換為 Base64 儲存)
  DOM.coverFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      DOM.settingsCoverPreview.style.backgroundImage = `url(${base64})`;
      DOM.settingsCoverPreview.textContent = '';
      
      const targetAccountId = DOM.settingChildSelect ? DOM.settingChildSelect.value || AppState.currentAccountId : AppState.currentAccountId;
      const acc = AppState.accounts.find(a => a.id === targetAccountId);
      if (acc) acc.coverImage = base64;
    };
    reader.readAsDataURL(file);
  });

  DOM.coverUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      DOM.settingsCoverPreview.style.backgroundImage = `url(${url})`;
      DOM.settingsCoverPreview.textContent = '';
      const targetAccountId = DOM.settingChildSelect ? DOM.settingChildSelect.value || AppState.currentAccountId : AppState.currentAccountId;
      const acc = AppState.accounts.find(a => a.id === targetAccountId);
      if (acc) acc.coverImage = url;
    }
  });

  DOM.btnResetCover.addEventListener('click', () => {
    const targetAccountId = DOM.settingChildSelect ? DOM.settingChildSelect.value || AppState.currentAccountId : AppState.currentAccountId;
    const acc = AppState.accounts.find(a => a.id === targetAccountId);
    if (acc) acc.coverImage = '';
    DOM.coverFileInput.value = '';
    DOM.coverUrlInput.value = '';
    DOM.settingsCoverPreview.style.backgroundImage = '';
    DOM.settingsCoverPreview.textContent = '恢復預設';
  });

  DOM.formPassbookSettings.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetAccountId = DOM.settingChildSelect ? DOM.settingChildSelect.value || AppState.currentAccountId : AppState.currentAccountId;
    const acc = AppState.accounts.find(a => a.id === targetAccountId) || getCurrentAccount();

    acc.childName = DOM.settingChildName.value.trim() || '小寶貝';
    acc.accountNumber = DOM.settingAccountNumber.value.trim() || 'SAV-2026-8888';
    acc.passbookTitle = DOM.settingPassbookTitle.value.trim() || '寶貝的專屬電子存摺';
    acc.currency = DOM.settingCurrency.value.trim() || 'NT$';
    
    if (DOM.settingParentPin.value.trim()) {
      if (DOM.settingParentPin.value.trim().length === 4) {
        acc.parentPin = DOM.settingParentPin.value.trim();
      } else {
        alert("PIN 碼必須為 4 位數字！");
        return;
      }
    }

    await FirebaseService.saveAccount(acc);
    renderCurrentAccountUI();
    renderChildPills();
    DOM.adminModal.classList.remove('active');
    alert(`✅ 【${acc.childName}】的存摺設定與 Canva 封面已成功儲存！`);
  });

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
      alert("請貼上 Firebase 設定代碼！");
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
          alert("🎉 家庭存摺資料已成功復原！即將重新載入。");
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
    const answer = prompt("⚠️ 此操作會清除所有孩子存款紀錄！如確定要重置，請輸入「確定清除」：");
    if (answer === '確定清除') {
      await FirebaseService.resetAll();
      window.location.reload();
    }
  });

  // ==================== 願望管理 (Goals - 依孩子區分) ====================
  DOM.btnOpenAddGoal.addEventListener('click', () => {
    if (DOM.goalChildSelect) {
      DOM.goalChildSelect.value = AppState.currentAccountId;
    }
    DOM.goalModal.classList.add('active');
  });

  DOM.formAddGoal.addEventListener('submit', async (e) => {
    e.preventDefault();
    const accountId = (DOM.goalChildSelect && DOM.goalChildSelect.value) ? DOM.goalChildSelect.value : (AppState.currentAccountId || AppState.accounts[0]?.id || 'child_default');
    const title = DOM.goalTitle.value.trim();
    const targetAmount = parseFloat(DOM.goalTargetAmount.value);
    const icon = DOM.goalIcon.value;
    const note = DOM.goalNote.value.trim();

    if (!title || !targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
      alert("請填寫願望名稱與正確的目標金額！");
      return;
    }

    const newGoal = {
      accountId,
      title,
      targetAmount,
      icon,
      note
    };

    try {
      const savedGoal = await FirebaseService.addGoal(newGoal);
      AppState.goals.push(savedGoal);

      DOM.goalTitle.value = '';
      DOM.goalTargetAmount.value = '';
      DOM.goalNote.value = '';
      DOM.goalModal.classList.remove('active');

      // 若為目前選定孩子新增，直接刷新；若為其他孩子新增，自動切換至該孩子
      if (accountId !== AppState.currentAccountId) {
        switchAccount(accountId);
      } else {
        renderGoals();
        renderStats();
      }

      SoundEffects.playFanfare();
      if (window.confettiManager) window.confettiManager.shoot(40);
      alert(`🎉 成功為孩子建立儲蓄願望：【${title}】！`);
    } catch (err) {
      console.error("建立願望失敗:", err);
      alert("建立願望失敗：" + err.message);
    }
  });

  // ==================== 結存與流水計算 (嚴格各自獨立) ====================
  function getChildTransactions(accountId = AppState.currentAccountId) {
    if (!accountId) return [];
    const firstAccId = AppState.accounts[0]?.id;
    return AppState.transactions.filter(t => {
      if (t.accountId) return t.accountId === accountId;
      // 舊資料相容：未標註 accountId 的舊紀錄僅歸屬第一位孩子，不重複出現在其他人存摺中
      return accountId === firstAccId;
    });
  }

  function getChildGoals(accountId = AppState.currentAccountId) {
    if (!accountId) return [];
    const firstAccId = AppState.accounts[0]?.id;
    return AppState.goals.filter(g => {
      if (g.accountId) return g.accountId === accountId;
      // 舊資料相容：未標註 accountId 的舊願望僅歸屬第一位孩子，不重複出現在其他人存摺中
      return accountId === firstAccId;
    });
  }

  function calculateAccountBalance(accountId) {
    const txns = getChildTransactions(accountId);
    const sortedAsc = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
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
    const total = calculateAccountBalance(AppState.currentAccountId);
    if (AppState.isBalanceMasked) {
      DOM.displayTotalBalance.textContent = '****';
    } else {
      DOM.displayTotalBalance.textContent = total.toLocaleString();
    }

    const currentAcc = getCurrentAccount();
    if (total === 0) {
      DOM.displayEncouragement.textContent = `🌱 【${currentAcc.childName}】每一枚小銅板，都在為未來的夢想施肥！`;
    } else if (total < 500) {
      DOM.displayEncouragement.textContent = `✨ 哇！【${currentAcc.childName}】的存錢小種子已經發芽囉，繼續加油！`;
    } else if (total < 2000) {
      DOM.displayEncouragement.textContent = `🌟 太厲害了！【${currentAcc.childName}】已經是一個自律的存錢小達人！`;
    } else {
      DOM.displayEncouragement.textContent = `👑 哇塞！金庫滿滿！有計畫的儲蓄讓【${currentAcc.childName}】離夢想更近！`;
    }
  }

  function renderPassbook() {
    renderBalanceDisplay();

    const txns = getChildTransactions(AppState.currentAccountId);
    const sortedAsc = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
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

    const sortedDesc = txnsWithBalance.reverse();

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
              <p>目前還沒有存款明細紀錄喔！</p>
              <small>點擊「家長記帳」為【${getCurrentAccount().childName}】存入第一筆成長基金吧 ✨</small>
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
      const idToDelete = AppState.selectedTxnForEdit.id;
      await FirebaseService.deleteTransaction(idToDelete);
      AppState.transactions = AppState.transactions.filter(t => t.id !== idToDelete);
      DOM.editTxnModal.classList.remove('active');
      AppState.selectedTxnForEdit = null;
      renderPassbook();
      renderStats();
      renderChildrenManagerList();
      updateInterestCalculation();
    }
  });

  // ==================== 渲染願望目標 (各自獨立) ====================
  function renderGoals() {
    const childGoals = getChildGoals(AppState.currentAccountId);
    const totalBalance = calculateAccountBalance(AppState.currentAccountId);
    DOM.goalsCountBadge.textContent = childGoals.length;

    if (childGoals.length === 0) {
      DOM.goalsListGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 10px;"></i>
          <p style="font-weight: 600;">【${getCurrentAccount().childName}】目前沒有設定願望目標喔！</p>
          <p style="font-size: 0.85rem;">點擊右上角「新增願望目標」，為【${getCurrentAccount().childName}】許下專屬夢想吧！</p>
        </div>
      `;
      return;
    }

    const currentAcc = getCurrentAccount();
    DOM.goalsListGrid.innerHTML = childGoals.map(g => {
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
              <div class="goal-amount">目標：${currentAcc.currency || 'NT$'} ${target.toLocaleString()}</div>
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
              <i class="fa-solid fa-trash-can"></i> 刪除
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 達成願望按鈕
    DOM.goalsListGrid.querySelectorAll('.btn-achieve-goal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await FirebaseService.toggleGoalComplete(id, true);
        const target = AppState.goals.find(g => g.id === id);
        if (target) target.completed = true;
        renderGoals();
        renderStats();
        SoundEffects.playFanfare();
        if (window.confettiManager) window.confettiManager.shoot(80);
      });
    });

    // 刪除願望按鈕 (立即刪除並刷新)
    DOM.goalsListGrid.querySelectorAll('.btn-delete-goal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const target = AppState.goals.find(g => g.id === id);
        if (confirm(`確定要刪除願望「${target ? target.title : '此目標'}」嗎？`)) {
          await FirebaseService.deleteGoal(id);
          AppState.goals = AppState.goals.filter(g => g.id !== id);
          renderGoals();
          renderStats();
        }
      });
    });
  }

  // ==================== 渲染成長統計 ====================
  function renderStats() {
    const txns = getChildTransactions(AppState.currentAccountId);
    const childGoals = getChildGoals(AppState.currentAccountId);

    let totalDeposits = 0;
    let totalWithdraws = 0;
    let totalRewards = 0;
    const catMap = {};

    txns.forEach(t => {
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

    const currentAcc = getCurrentAccount();
    const currency = currentAcc.currency || 'NT$';
    DOM.statTotalDeposits.textContent = `${currency} ${totalDeposits.toLocaleString()}`;
    DOM.statTotalWithdraws.textContent = `${currency} ${totalWithdraws.toLocaleString()}`;
    DOM.statTotalRewards.textContent = `${currency} ${totalRewards.toLocaleString()}`;
    
    const completedCount = childGoals.filter(g => g.completed).length;
    DOM.statCompletedGoals.textContent = `${completedCount} 個`;

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
