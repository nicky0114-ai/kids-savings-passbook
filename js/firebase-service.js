/**
 * Firebase Firestore 雲端資料庫服務模組
 * 支援即時同步 (Real-time Sync)、自動備援到 LocalStorage、匯出/匯入
 */

const DB_KEYS = {
  FIREBASE_CONFIG: 'kids_passbook_firebase_config',
  LOCAL_TXNS: 'kids_passbook_txns',
  LOCAL_GOALS: 'kids_passbook_goals',
  LOCAL_SETTINGS: 'kids_passbook_settings'
};

const DEFAULT_SETTINGS = {
  childName: '小寶貝',
  accountNumber: 'SAV-2026-8888',
  passbookTitle: '寶貝的專屬電子存摺',
  currency: 'NT$',
  parentPin: '1234',
  openDate: '2026-01-01',
  coverImage: '', // Canva 匯出之圖片 (Base64 或 URL)
  annualInterestRate: 5
};

const FirebaseService = {
  db: null,
  isOnline: false,
  unsubscribeTxns: null,
  unsubscribeGoals: null,
  unsubscribeSettings: null,

  // 初始化連線
  async init(onStateChange) {
    const savedConfigStr = localStorage.getItem(DB_KEYS.FIREBASE_CONFIG);
    if (!savedConfigStr) {
      this.isOnline = false;
      if (onStateChange) onStateChange(false, '本地模式 (未串接 Firebase)');
      return false;
    }

    try {
      const config = JSON.parse(savedConfigStr);
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

    // 取出最外層 { ... } 內容
    const braceMatch = str.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      str = braceMatch[0];
    }

    // 嘗試標準 JSON 解析
    try {
      return JSON.parse(str);
    } catch (e1) {
      // 嘗試 JS 物件解析 (處理 key 沒有雙引號、單引號字串或結尾逗號等情況)
      try {
        const fn = new Function(`return (${str});`);
        const obj = fn();
        if (obj && typeof obj === 'object') {
          return obj;
        }
      } catch (e2) {
        // Regex 嘗試補上雙引號
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
      
      // 重新載入以套用新的 Firebase 實例
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

  // 取得目前設定
  async getSettings() {
    if (this.isOnline && this.db) {
      try {
        const doc = await this.db.collection('settings').doc('general').get();
        if (doc.exists) {
          return { ...DEFAULT_SETTINGS, ...doc.data() };
        }
      } catch (e) {
        console.warn("無法從雲端讀取設定，改讀本地:", e);
      }
    }
    const local = localStorage.getItem(DB_KEYS.LOCAL_SETTINGS);
    return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : { ...DEFAULT_SETTINGS };
  },

  // 儲存設定
  async saveSettings(settings) {
    localStorage.setItem(DB_KEYS.LOCAL_SETTINGS, JSON.stringify(settings));
    if (this.isOnline && this.db) {
      try {
        await this.db.collection('settings').doc('general').set(settings, { merge: true });
      } catch (e) {
        console.error("雲端同步設定失敗:", e);
      }
    }
  },

  // 監聽即時交易明細
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
          // 備份一份到本地
          localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(txns));
          callback(txns);
        }, (err) => {
          console.error("Firestore 監聽失敗，改用本地資料:", err);
          callback(this.getLocalTransactions());
        });
    } else {
      // 本地模式
      callback(this.getLocalTransactions());
    }
  },

  getLocalTransactions() {
    const local = localStorage.getItem(DB_KEYS.LOCAL_TXNS);
    return local ? JSON.parse(local) : [];
  },

  // 新增交易
  async addTransaction(txn) {
    const newTxn = {
      ...txn,
      createdAt: new Date().toISOString()
    };

    if (this.isOnline && this.db) {
      const docRef = await this.db.collection('transactions').add(newTxn);
      newTxn.id = docRef.id;
    } else {
      newTxn.id = 'loc_' + Date.now();
      const local = this.getLocalTransactions();
      local.unshift(newTxn);
      localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(local));
    }
    return newTxn;
  },

  // 刪除交易
  async deleteTransaction(txnId) {
    if (this.isOnline && this.db) {
      await this.db.collection('transactions').doc(txnId).delete();
    }
    const local = this.getLocalTransactions().filter(t => t.id !== txnId);
    localStorage.setItem(DB_KEYS.LOCAL_TXNS, JSON.stringify(local));
  },

  // 監聽願望清單
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
      completed: false,
      createdAt: new Date().toISOString()
    };
    if (this.isOnline && this.db) {
      const docRef = await this.db.collection('goals').add(newGoal);
      newGoal.id = docRef.id;
    } else {
      newGoal.id = 'goal_' + Date.now();
      const local = this.getLocalGoals();
      local.push(newGoal);
      localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(local));
    }
    return newGoal;
  },

  async toggleGoalComplete(goalId, completed) {
    if (this.isOnline && this.db) {
      await this.db.collection('goals').doc(goalId).update({ completed });
    }
    const local = this.getLocalGoals().map(g => g.id === goalId ? { ...g, completed } : g);
    localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(local));
  },

  async deleteGoal(goalId) {
    if (this.isOnline && this.db) {
      await this.db.collection('goals').doc(goalId).delete();
    }
    const local = this.getLocalGoals().filter(g => g.id !== goalId);
    localStorage.setItem(DB_KEYS.LOCAL_GOALS, JSON.stringify(local));
  },

  // 匯出全部資料為 JSON
  async exportFullBackup() {
    const settings = await this.getSettings();
    const transactions = this.getLocalTransactions();
    const goals = this.getLocalGoals();

    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings,
      transactions,
      goals
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `小寶貝成長存摺備份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 匯入 JSON 復原
  async importFullBackup(jsonData) {
    try {
      if (!jsonData.settings && !jsonData.transactions) {
        throw new Error("無效的備份檔案格式");
      }

      if (jsonData.settings) {
        await this.saveSettings(jsonData.settings);
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

  // 清除全部
  async resetAll() {
    localStorage.removeItem(DB_KEYS.LOCAL_TXNS);
    localStorage.removeItem(DB_KEYS.LOCAL_GOALS);
    if (this.isOnline && this.db) {
      // 刪除交易與願望
      const txns = await this.db.collection('transactions').get();
      const batch1 = this.db.batch();
      txns.forEach(doc => batch1.delete(doc.ref));
      await batch1.commit();

      const goals = await this.db.collection('goals').get();
      const batch2 = this.db.batch();
      goals.forEach(doc => batch2.delete(doc.ref));
      await batch2.commit();
    }
  }
};

window.FirebaseService = FirebaseService;
window.DB_KEYS = DB_KEYS;
