/**
 * Firebase Firestore 雲端資料庫服務模組 (支援多孩童帳戶管理)
 * 支援即時同步 (Real-time Sync)、多孩童帳戶切換、自動備援到 LocalStorage、匯出/匯入
 */

const DB_KEYS = {
  FIREBASE_CONFIG: 'kids_passbook_firebase_config',
  LOCAL_ACCOUNTS: 'kids_passbook_accounts',
  LOCAL_TXNS: 'kids_passbook_txns',
  LOCAL_GOALS: 'kids_passbook_goals',
  LOCAL_SETTINGS: 'kids_passbook_settings'
};

const DEFAULT_ACCOUNT = {
  id: 'child_default',
  childName: '小寶貝',
  avatar: '👦',
  accountNumber: 'SAV-2026-8888',
  passbookTitle: '寶貝的專屬電子存摺',
  currency: 'NT$',
  parentPin: '1234',
  openDate: '2026-01-01',
  coverImage: '', // Canva 匯出之圖片 (Base64 或 URL)
  annualInterestRate: 5
};

/**
 * 💡【全家裝置免設定：內建 Firebase 設定】
 * 如果您希望所有小孩的手機/平板「打開網址就自動連線雲端，不用每台手動貼設定」：
 * 請將 Firebase 控制台複製的 firebaseConfig 貼在下方 EMBEDDED_FIREBASE_CONFIG 中！
 */
const EMBEDDED_FIREBASE_CONFIG = const EMBEDDED_FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "kids-savings-passbook.firebaseapp.com",
  projectId: "kids-savings-passbook",
  storageBucket: "kids-savings-passbook.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};;

const FirebaseService = {
  db: null,
  isOnline: false,
  unsubscribeAccounts: null,
  unsubscribeTxns: null,
  unsubscribeGoals: null,

  // 初始化連線
  async init(onStateChange) {
    // 1. 檢查網址是否有自帶加密設定參數 ?cfg=... 或 #cfg=... (平板點擊專屬連結時自動儲存)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      let urlCfg = urlParams.get('cfg');
      if (!urlCfg && hash.includes('cfg=')) {
        const match = hash.match(/cfg=([^&]+)/);
        if (match) urlCfg = match[1];
      }

      if (urlCfg) {
        const decoded = decodeURIComponent(atob(urlCfg));
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.apiKey && parsed.projectId) {
          localStorage.setItem(DB_KEYS.FIREBASE_CONFIG, JSON.stringify(parsed));
          console.log("✅ 已透過專屬連結自動完成 Firebase 雲端設定！");
          // 保持網址乾淨，清除 cfg 參數但保留 child 參數
          const childParam = urlParams.get('child');
          const cleanUrl = window.location.origin + window.location.pathname + (childParam ? `?child=${encodeURIComponent(childParam)}` : '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.warn("無法解析網址中的 Firebase 設定參數:", e);
    }

    // 2. 決定使用的 Firebase Config（優先順序：內嵌設定 > 瀏覽器 LocalStorage）
    let config = null;
    if (typeof EMBEDDED_FIREBASE_CONFIG !== 'undefined' && EMBEDDED_FIREBASE_CONFIG && EMBEDDED_FIREBASE_CONFIG.apiKey) {
      config = EMBEDDED_FIREBASE_CONFIG;
    } else {
      const savedConfigStr = localStorage.getItem(DB_KEYS.FIREBASE_CONFIG);
      if (savedConfigStr) {
        try {
          config = JSON.parse(savedConfigStr);
        } catch (e) {}
      }
    }

    if (!config) {
      this.isOnline = false;
      if (onStateChange) onStateChange(false, '本地模式 (未串接 Firebase)');
      return false;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      this.db = firebase.firestore();
      this.isOnline = true;
      if (onStateChange) onStateChange(true, 'Firebase 雲端即時連線中 🟢');
      return true;
    } catch (err) {
      console.error("Firebase 初始化失敗:", err);
      this.isOnline = false;
      if (onStateChange) onStateChange(false, '連線失敗，目前為本地模式');
      return false;
    }
  },

  // 智慧解析 Firebase Config（支援標準 JSON、JS 物件語法、含 const 宣告等格式）
  parseConfig(inputStr) {
    if (!inputStr) throw new Error("設定內容為空");
    let str = inputStr.trim();

    const braceMatch = str.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      str = braceMatch[0];
    }

    try {
      return JSON.parse(str);
    } catch (e1) {
      try {
        const fn = new Function(`return (${str});`);
        const obj = fn();
        if (obj && typeof obj === 'object') {
          return obj;
        }
      } catch (e2) {
        try {
          const formatted = str
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
            .replace(/'/g, '"')
            .replace(/,\s*([}\]])/g, '$1');
          return JSON.parse(formatted);
        } catch (e3) {
          throw new Error("無法解析設定格式，請確認是否完整複製 { ... } 內容！");
        }
      }
    }
  },

  // 儲存並連接新的 Firebase 設定
  async setConfig(configInputStr) {
    try {
      const config = this.parseConfig(configInputStr);
      if (!config.apiKey || !config.projectId) {
        throw new Error("缺少必要的 apiKey 或 projectId 欄位，請確認複製的內容是否完整。");
      }
      localStorage.setItem(DB_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
      window.location.reload();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 移除 Firebase 設定，回歸本地
  disconnect() {
    localStorage.removeItem(DB_KEYS.FIREBASE_CONFIG);
    window.location.reload();
  },

  // ==================== 多孩童帳戶 (ACCOUNTS) ====================
  subscribeAccounts(callback) {
    if (this.isOnline && this.db) {
      if (this.unsubscribeAccounts) this.unsubscribeAccounts();
      this.unsubscribeAccounts = this.db.collection('accounts')
        .onSnapshot(async (snapshot) => {
          let accounts = [];
          snapshot.forEach((doc) => {
            accounts.push({ id: doc.id, ...doc.data() });
          });

          // 若雲端尚無任何帳戶，自動將預設帳戶寫入
          if (accounts.length === 0) {
            const defaultAcc = this.getLocalAccounts()[0] || DEFAULT_ACCOUNT;
            await this.db.collection('accounts').doc(defaultAcc.id).set(defaultAcc);
            accounts = [defaultAcc];
          }

          localStorage.setItem(DB_KEYS.LOCAL_ACCOUNTS, JSON.stringify(accounts));
          callback(accounts);
        }, (err) => {
          console.error("Accounts 監聽失敗，改用本地資料:", err);
          callback(this.getLocalAccounts());
        });
    } else {
      callback(this.getLocalAccounts());
    }
  },

  getLocalAccounts() {
    const local = localStorage.getItem(DB_KEYS.LOCAL_ACCOUNTS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // 檢查是否有舊的單一 settings 資料需要遷移
    const oldSettings = localStorage.getItem(DB_KEYS.LOCAL_SETTINGS);
    if (oldSettings) {
      try {
        const s = JSON.parse(oldSettings);
        const migrated = [{
          id: 'child_default',
          childName: s.childName || '小寶貝',
          avatar: '👦',
          accountNumber: s.accountNumber || 'SAV-2026-8888',
          passbookTitle: s.passbookTitle || '寶貝的專屬電子存摺',
          currency: s.currency || 'NT$',
          parentPin: s.parentPin || '1234',
          openDate: s.openDate || '2026-01-01',
          coverImage: s.coverImage || '',
          annualInterestRate: s.annualInterestRate || 5
        }];
        localStorage.setItem(DB_KEYS.LOCAL_ACCOUNTS, JSON.stringify(migrated));
        return migrated;
      } catch (e) {}
    }
    return [DEFAULT_ACCOUNT];
  },

  async saveAccount(account) {
    const accToSave = {
      ...DEFAULT_ACCOUNT,
      ...account
    };
    if (!accToSave.id) {
      accToSave.id = 'child_' + Date.now();
    }

    const localAccounts = this.getLocalAccounts();
    const existingIndex = localAccounts.findIndex(a => a.id === accToSave.id);
    if (existingIndex >= 0) {
      localAccounts[existingIndex] = accToSave;
    } else {
      localAccounts.push(accToSave);
    }
    localStorage.setItem(DB_KEYS.LOCAL_ACCOUNTS, JSON.stringify(localAccounts));

    if (this.isOnline && this.db) {
      try {
        await this.db.collection('accounts').doc(accToSave.id).set(accToSave, { merge: true });
      } catch (e) {
        console.error("雲端儲存帳戶失敗，已保留本地備份:", e);
      }
    }
    return accToSave;
  },

  async deleteAccount(accountId) {
    const localAccounts = this.getLocalAccounts().filter(a => a.id !== accountId);
    localStorage.setItem(DB_KEYS.LOCAL_ACCOUNTS, JSON.stringify(localAccounts));

    if (this.isOnline && this.db) {
      try {
        await this.db.collection('accounts').doc(accountId).delete();
      } catch (e) {
        console.error("雲端刪除帳戶失敗:", e);
      }
    }
  },

  // ==================== 交易明細 (TRANSACTIONS) ====================
  subscribeTransactions(callback) {
    if (this.isOnline && this.db) {
      if (this.unsubscribeTxns) this.unsubscribeTxns();
      this.unsubscribeTxns = this.db.collection('transactions')
        .orderBy('date', 'desc')
        .onSnapshot((snapshot) => {
          const txns = [];
          snapshot.forEach((doc) => {
            txns.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(txns));
          callback(txns);
        }, (err) => {
          console.error("Firestore 交易監聽失敗，改用本地資料:", err);
          callback(this.getLocalTransactions());
        });
    } else {
      callback(this.getLocalTransactions());
    }
  },

  getLocalTransactions() {
    const local = localStorage.getItem(DB_KEYS.LOCAL_TXNS);
    return local ? JSON.parse(local) : [];
  },

  async addTransaction(txn) {
    const newTxn = {
      ...txn,
      id: txn.id || 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString()
    };

    // 優先寫入本地快取
    const local = this.getLocalTransactions();
    local.unshift(newTxn);
    localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(local));

    if (this.isOnline && this.db) {
      try {
        const docRef = await this.db.collection('transactions').add(newTxn);
        newTxn.id = docRef.id;
      } catch (e) {
        console.error("雲端存入交易失敗，已保留本地備份:", e);
      }
    }
    return newTxn;
  },

  async deleteTransaction(txnId) {
    const local = this.getLocalTransactions().filter(t => t.id !== txnId);
    localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(local));

    if (this.isOnline && this.db) {
      try {
        await this.db.collection('transactions').doc(txnId).delete();
      } catch (e) {
        console.error("雲端刪除交易失敗:", e);
      }
    }
  },

  // ==================== 願望清單 (GOALS) ====================
  subscribeGoals(callback) {
    if (this.isOnline && this.db) {
      if (this.unsubscribeGoals) this.unsubscribeGoals();
      this.unsubscribeGoals = this.db.collection('goals')
        .onSnapshot((snapshot) => {
          const goals = [];
          snapshot.forEach((doc) => {
            goals.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(goals));
          callback(goals);
        }, (err) => {
          console.error("Goals 監聽失敗:", err);
          callback(this.getLocalGoals());
        });
    } else {
      callback(this.getLocalGoals());
    }
  },

  getLocalGoals() {
    const local = localStorage.getItem(DB_KEYS.LOCAL_GOALS);
    return local ? JSON.parse(local) : [];
  },

  async addGoal(goal) {
    const newGoal = {
      ...goal,
      id: goal.id || 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      completed: false,
      createdAt: new Date().toISOString()
    };

    // 優先寫入本地快取
    const local = this.getLocalGoals();
    local.push(newGoal);
    localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(local));

    if (this.isOnline && this.db) {
      try {
        const docRef = await this.db.collection('goals').add(newGoal);
        newGoal.id = docRef.id;
      } catch (e) {
        console.error("雲端新增願望失敗，已保留本地備份:", e);
      }
    }
    return newGoal;
  },

  async toggleGoalComplete(goalId, completed) {
    const local = this.getLocalGoals().map(g => g.id === goalId ? { ...g, completed } : g);
    localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(local));

    if (this.isOnline && this.db) {
      try {
        await this.db.collection('goals').doc(goalId).update({ completed });
      } catch (e) {
        console.error("雲端更新願望狀態失敗:", e);
      }
    }
  },

  async deleteGoal(goalId) {
    const local = this.getLocalGoals().filter(g => g.id !== goalId);
    localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(local));

    if (this.isOnline && this.db) {
      try {
        await this.db.collection('goals').doc(goalId).delete();
      } catch (e) {
        console.error("雲端刪除願望失敗:", e);
      }
    }
  },

  // ==================== 備份與復原 ====================
  async exportFullBackup() {
    const accounts = this.getLocalAccounts();
    const transactions = this.getLocalTransactions();
    const goals = this.getLocalGoals();

    const backupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      accounts,
      transactions,
      goals
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家庭成長電子存摺全部備份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importFullBackup(jsonData) {
    try {
      if (!jsonData.accounts && !jsonData.transactions) {
        throw new Error("無效的備份檔案格式");
      }

      if (Array.isArray(jsonData.accounts)) {
        localStorage.setItem(DB_KEYS.LOCAL_ACCOUNTS, JSON.stringify(jsonData.accounts));
        if (this.isOnline && this.db) {
          const batch = this.db.batch();
          jsonData.accounts.forEach(a => {
            const docRef = this.db.collection('accounts').doc(a.id);
            batch.set(docRef, a);
          });
          await batch.commit();
        }
      }

      if (Array.isArray(jsonData.transactions)) {
        localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(jsonData.transactions));
        if (this.isOnline && this.db) {
          const batch = this.db.batch();
          jsonData.transactions.forEach(t => {
            const docRef = this.db.collection('transactions').doc(t.id || undefined);
            batch.set(docRef, t);
          });
          await batch.commit();
        }
      }

      if (Array.isArray(jsonData.goals)) {
        localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(jsonData.goals));
        if (this.isOnline && this.db) {
          const batch = this.db.batch();
          jsonData.goals.forEach(g => {
            const docRef = this.db.collection('goals').doc(g.id || undefined);
            batch.set(docRef, g);
          });
          await batch.commit();
        }
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async resetAll() {
    localStorage.removeItem(DB_KEYS.LOCAL_ACCOUNTS);
    localStorage.removeItem(DB_KEYS.LOCAL_TXNS);
    localStorage.removeItem(DB_KEYS.LOCAL_GOALS);
    if (this.isOnline && this.db) {
      const accs = await this.db.collection('accounts').get();
      const batchAcc = this.db.batch();
      accs.forEach(doc => batchAcc.delete(doc.ref));
      await batchAcc.commit();

      const txns = await this.db.collection('transactions').get();
      const batchTxn = this.db.batch();
      txns.forEach(doc => batchTxn.delete(doc.ref));
      await batchTxn.commit();

      const goals = await this.db.collection('goals').get();
      const batchGoal = this.db.batch();
      goals.forEach(doc => batchGoal.delete(doc.ref));
      await batchGoal.commit();
    }
  }
};

window.FirebaseService = FirebaseService;
window.DB_KEYS = DB_KEYS;
