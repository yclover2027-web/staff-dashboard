const GAS_URL = "https://script.google.com/macros/s/AKfycbxLyPhC1vbqpAaFFVJEW4Ava1ls4hrCUzU9ME5d9T73kIMsXlztQ7fYphdPt23bViT_Pg/exec";

// DOM Elements
const loginScreen = document.getElementById('loginScreen') as HTMLDivElement;
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const adminPasswordInput = document.getElementById('adminPassword') as HTMLInputElement;
const loginError = document.getElementById('loginError') as HTMLDivElement;

const dashboard = document.getElementById('dashboard') as HTMLDivElement;
const empList = document.getElementById('empList') as HTMLUListElement;
const btnRefresh = document.getElementById('btnRefresh') as HTMLButtonElement;

const globalLoader = document.getElementById('globalLoader') as HTMLDivElement;
const empSearchInput = document.getElementById('empSearchInput') as HTMLInputElement;

// 家族Modal
const btnOpenFamilyModal = document.getElementById('btnOpenFamilyModal') as HTMLButtonElement;
const familyModal = document.getElementById('familyModal') as HTMLDivElement;
const btnCancelFamily = document.getElementById('btnCancelFamily') as HTMLButtonElement;
const familyForm = document.getElementById('familyForm') as HTMLFormElement;
const familyTargetEmpName = document.getElementById('familyTargetEmpName') as HTMLParagraphElement;
const submitFamilyLoader = document.getElementById('submitFamilyLoader') as HTMLDivElement;
const submitFamilyText = document.getElementById('submitFamilyText') as HTMLSpanElement;

// Detail Area
const empDetailContainer = document.getElementById('empDetailContainer') as HTMLDivElement;
const welcomeMessage = document.getElementById('welcomeMessage') as HTMLDivElement;
const detailName = document.getElementById('detailName') as HTMLHeadingElement;
const detailEmpId = document.getElementById('detailEmpId') as HTMLSpanElement;
const detailBirth = document.getElementById('detailBirth') as HTMLSpanElement;
const detailJoinDate = document.getElementById('detailJoinDate') as HTMLSpanElement;
const detailLeaveDate = document.getElementById('detailLeaveDate') as HTMLSpanElement;
const detailAddress = document.getElementById('detailAddress') as HTMLSpanElement;
const btnToggleAddressHistory = document.getElementById('btnToggleAddressHistory') as HTMLButtonElement;
const addressHistoryContainer = document.getElementById('addressHistoryContainer') as HTMLDivElement;
const addressHistoryList = document.getElementById('addressHistoryList') as HTMLUListElement;
const detailEmgName = document.getElementById('detailEmgName') as HTMLSpanElement;
const detailEmgPhone = document.getElementById('detailEmgPhone') as HTMLSpanElement;
const detailEmgAddress = document.getElementById('detailEmgAddress') as HTMLSpanElement;

// 家族追加モーダル新規用
const famRelationInput = document.getElementById('famRelationInput') as HTMLSelectElement;
const famAddYear = document.getElementById('famAddYear') as HTMLSelectElement;
const famAddMonth = document.getElementById('famAddMonth') as HTMLSelectElement;
const famAddDay = document.getElementById('famAddDay') as HTMLSelectElement;
const famAddUnknownCheck = document.getElementById('famAddUnknownCheck') as HTMLInputElement;
const famEditDateGroup = document.getElementById('famEditDateGroup') as HTMLDivElement;
const famAddApproxAgeGroup = document.getElementById('famAddApproxAgeGroup') as HTMLDivElement;
const famAddApproxAge = document.getElementById('famAddApproxAge') as HTMLInputElement;

// 郵便番号検索用
const editEmpZip = document.getElementById('editEmpZip') as HTMLInputElement;
const btnEditSearchZip = document.getElementById('btnEditSearchZip') as HTMLButtonElement;

// Sub Lists
const familyList = document.getElementById('familyList') as HTMLUListElement;
const noFamilyMsg = document.getElementById('noFamilyMsg') as HTMLDivElement;
const salaryList = document.getElementById('salaryList') as HTMLUListElement;
const noSalaryMsg = document.getElementById('noSalaryMsg') as HTMLDivElement;

// Modal
const btnOpenSalaryModal = document.getElementById('btnOpenSalaryModal') as HTMLButtonElement;
const salaryModal = document.getElementById('salaryModal') as HTMLDivElement;
const btnCancelSalary = document.getElementById('btnCancelSalary') as HTMLButtonElement;
const salaryForm = document.getElementById('salaryForm') as HTMLFormElement;
const salaryTargetEmpName = document.getElementById('salaryTargetEmpName') as HTMLParagraphElement;
const btnSubmitSalary = document.getElementById('btnSubmitSalary') as HTMLButtonElement; // ID修正
const submitSalaryText = document.getElementById('submitSalaryText') as HTMLSpanElement;
const submitSalaryLoader = document.getElementById('submitSalaryLoader') as HTMLDivElement;

// State
let appData: any = { employees: [], families: [], salaries: [] };
let currentPassword = "";
let currentSelectedEmpId = "";
let isFamilyExpanded = false; // 家族構成の展開状態

// ヘルパー：日付フォーマット（T15:00:00.000Z などのUTCズレを日本時間で綺麗に表示する）
function formatDateString(dateVal: any): string {
  if (!dateVal) return '-';
  const str = String(dateVal);
  // 日付時刻のような文字列なら変換
  if (str.includes('T') && str.endsWith('Z')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}/${m}/${day}`;
    }
  }
  return str.split('T')[0].replace(/-/g, '/');
}

// ヘルパー：年齢計算
function calculateAge(birthDateStr: string): string {
  if (!birthDateStr) return "不明";
  if (birthDateStr.includes("不明")) return birthDateStr; // 手入力用

  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return "不明";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return String(age);
}

// （重複した calculateAge を削除）
// ヘルパー：勤続年数計算
function calculateTenure(joinDateStr: string, leaveDateStr: string): string {
  if (!joinDateStr || joinDateStr === '-') return "";
  let jStr = String(joinDateStr);
  let lStr = String(leaveDateStr);
  if (jStr.includes('T')) jStr = jStr.split('T')[0];
  if (lStr.includes('T')) lStr = lStr.split('T')[0];
  
  const joinDate = new Date(jStr);
  if (isNaN(joinDate.getTime())) return "";

  // 退社日があればそこまで、なければ今日の日付で計算
  const endDate = (lStr && lStr !== '-' && !isNaN(new Date(lStr).getTime())) ? new Date(lStr) : new Date();

  let years = endDate.getFullYear() - joinDate.getFullYear();
  let months = endDate.getMonth() - joinDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  if (endDate.getDate() < joinDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  if (years === 0 && months === 0) return "（1ヶ月未満）";
  let result = "（勤続 ";
  if (years > 0) result += `${years}年`;
  if (months > 0) result += `${months}ヶ月`;
  result += "）";
  return result;
}

// 金額フォーマット
function formatCurrency(amount: any): string {
  if (!amount) return "-";
  const num = Number(String(amount).replace(/,/g, ''));
  if (isNaN(num)) return String(amount);
  return num.toLocaleString() + " 円";
}

// 初期化（ログイン処理）
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentPassword = adminPasswordInput.value;
  await loadDashboardData();
});

btnRefresh.addEventListener('click', async () => {
  await loadDashboardData();
});

empSearchInput.addEventListener('input', () => {
  renderEmployeeList();
});

// データ取得と描画
async function loadDashboardData() {
  loginError.style.display = 'none';
  globalLoader.style.display = 'flex';

  try {
    const payload = { action: "getDashboardData", password: currentPassword };
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === "success") {
      appData = result.data;
      // ログイン画面を隠してダッシュボードを表示
      loginScreen.style.display = 'none';
      dashboard.style.display = 'flex';
      
      renderEmployeeList();
      
      // すでに誰かを選択中なら、詳細を更新する
      if (currentSelectedEmpId) {
        selectEmployee(currentSelectedEmpId);
      }
    } else {
      loginError.style.display = 'block';
      if (result.message.includes("Password")) {
        loginError.textContent = "パスワードが間違っています。";
      } else {
        loginError.textContent = "エラー: " + result.message;
      }
      currentPassword = "";
    }
  } catch (err) {
    loginError.style.display = 'block';
    loginError.textContent = "通信に失敗しました。";
  } finally {
    globalLoader.style.display = 'none';
  }
}

// 従業員リストの描画
function renderEmployeeList() {
  empList.innerHTML = '';
  const searchWord = empSearchInput.value.toLowerCase().trim();

  // フリガナ（無い場合は名前）でソート（あいうえお順）
  let sortedEmp = [...appData.employees].sort((a: any, b: any) => {
    const kanaA = a['フリガナ'] || String(a['お名前'] || '');
    const kanaB = b['フリガナ'] || String(b['お名前'] || '');
    return kanaA.localeCompare(kanaB, 'ja');
  });

  // 検索フィルタリング
  if (searchWord) {
    sortedEmp = sortedEmp.filter((emp: any) => {
      const name = emp['お名前'] || '';
      const kana = emp['フリガナ'] || '';
      return name.toLowerCase().includes(searchWord) || kana.toLowerCase().includes(searchWord);
    });
  }

  sortedEmp.forEach((emp: any) => {
    const li = document.createElement('li');
    li.className = `emp-item ${emp['従業員ID'] === currentSelectedEmpId ? 'active' : ''}`;
    li.textContent = emp['お名前'] || '名前なし';
    li.addEventListener('click', () => selectEmployee(emp['従業員ID']));
    empList.appendChild(li);
  });
}

// 従業員詳細の表示
function selectEmployee(empId: string) {
  if (currentSelectedEmpId !== empId) {
    isFamilyExpanded = false; // 別の社員を選んだらリセット
  }
  currentSelectedEmpId = empId;
  renderEmployeeList(); // アクティブ表示更新

  const emp = appData.employees.find((e: any) => e['従業員ID'] === empId);
  if (!emp) return;

  (document.getElementById('editJoinDate') as HTMLInputElement).value = emp['入社日'] ? formatDateString(emp['入社日']).replace(/\//g, '-') : '';
  (document.getElementById('editLeaveDate') as HTMLInputElement).value = emp['退社日'] ? formatDateString(emp['退社日']).replace(/\//g, '-') : '';
  (document.getElementById('editBirthDate') as HTMLInputElement).value = emp['生年月日'] || '';
  (document.getElementById('editAddress') as HTMLInputElement).value = emp['住所'] || '';

  welcomeMessage.style.display = 'none';
  empDetailContainer.style.display = 'block';

  // 基本情報
  detailName.textContent = emp['お名前'] || '-';
  detailEmpId.textContent = "ID: " + emp['従業員ID'];
  const age = calculateAge(emp['生年月日']);
  const formattedBirth = formatDateString(emp['生年月日']);
  detailBirth.textContent = `${formattedBirth} (${age}歳)`;
  
  const formattedJoin = formatDateString(emp['入社日']);
  const formattedLeave = formatDateString(emp['退社日']);
  const tenure = calculateTenure(emp['入社日'], emp['退社日']);
  
  detailJoinDate.textContent = `${formattedJoin} ${tenure}`;
  detailLeaveDate.textContent = formattedLeave;
  detailAddress.textContent = emp['住所'] || '-';

  // 住所履歴
  let hasHistory = false;
  addressHistoryList.innerHTML = '';
  if (emp['住所履歴']) {
    try {
      const historyArr = JSON.parse(emp['住所履歴']);
      if (Array.isArray(historyArr) && historyArr.length > 0) {
        hasHistory = true;
        // 新しい順に表示
        [...historyArr].reverse().forEach((item: any) => {
          const li = document.createElement('li');
          li.style.marginBottom = '0.3rem';
          li.innerHTML = `<strong>${item.date} まで:</strong> ${item.address}`;
          addressHistoryList.appendChild(li);
        });
      }
    } catch (e) {
      // JSONじゃなかった場合
      hasHistory = true;
      const li = document.createElement('li');
      li.textContent = String(emp['住所履歴']);
      addressHistoryList.appendChild(li);
    }
  }

  if (hasHistory) {
    btnToggleAddressHistory.style.display = 'block';
  } else {
    btnToggleAddressHistory.style.display = 'none';
  }
  addressHistoryContainer.style.display = 'none';
  btnToggleAddressHistory.textContent = '📜 過去の履歴';

  // 緊急連絡先
  detailEmgName.textContent = `${emp['緊急連絡先_名前'] || '-'} (${emp['緊急連絡先_続柄'] || '-'})`;
  detailEmgPhone.textContent = emp['緊急連絡先_電話番号'] || '-';
  detailEmgAddress.textContent = emp['緊急連絡先_住所'] || '-';

  // 家族リストの抽出と描画
  let myFamilies = appData.families.filter((f: any) => f['従業員ID'] === empId);
  
  // 年齢順（年長者から順）にソート
  myFamilies.sort((a: any, b: any) => {
    const getBirthYear = (fam: any) => {
      const bStr = fam['生年月日'] || '';
      if (!bStr) return 9999;
      if (bStr.includes('不明')) {
        const matches = bStr.match(/\d+/);
        if (matches) {
          const age = parseInt(matches[0]);
          return new Date().getFullYear() - age; 
        }
        return 9999;
      }
      const d = new Date(bStr);
      return isNaN(d.getTime()) ? 9999 : d.getFullYear();
    };
    // 年度が小さい（1960年とか）ほうが年長なので、a - b で昇順ソート＝年長者順
    const yearA = getBirthYear(a);
    const yearB = getBirthYear(b);
    if (yearA !== yearB) return yearA - yearB;
    
    // 年が同じなら日付で比較
    return new Date(a['生年月日']).getTime() - new Date(b['生年月日']).getTime();
  });

  familyList.innerHTML = '';
  const displayFamilies = isFamilyExpanded ? myFamilies : myFamilies.slice(0, 3);

  if (myFamilies.length > 0) {
    noFamilyMsg.style.display = 'none';
    
    // グリッドレイアウト用のクラスを追加
    familyList.className = 'sub-list family-grid';
    
    displayFamilies.forEach((fam: any) => {
      const li = document.createElement('li');
      li.className = 'sub-item family-card';
      const famAge = calculateAge(fam['生年月日']);
      const famFormattedBirth = formatDateString(fam['生年月日']);
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #CCFBF1; padding-bottom: 0.2rem; margin-bottom: 0.5rem;">
          <span class="sub-item-title" style="border: none; margin: 0; padding: 0;">${fam['続柄']}</span>
          <button class="btnDeleteFamily" data-id="${fam['家族情報ID']}" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; opacity: 0.6; padding: 0.2rem;" title="削除する">🗑️</button>
        </div>
        <div class="info-row"><span class="info-label">生年月日(年齢)</span><span class="info-value">${famFormattedBirth} (${famAge}歳)</span></div>
        <div class="info-row"><span class="info-label">同居</span><span class="info-value">${fam['同居の有無']}</span></div>
      `;
      familyList.appendChild(li);
    });

    // 「もっと見る」ボタンの制御
    const existingToggle = document.getElementById('btnToggleFamily');
    if (existingToggle) existingToggle.parentElement?.remove(); // 重複防止

    if (myFamilies.length > 3) {
      const toggleDiv = document.createElement('div');
      toggleDiv.className = 'family-toggle-container';
      toggleDiv.innerHTML = `
        <button id="btnToggleFamily" class="toggle-btn">
          ${isFamilyExpanded ? '🔼 閉じる' : `🔽 もっと見る (あと ${myFamilies.length - 3}人)`}
        </button>
      `;
      familyList.after(toggleDiv); // <ul>の直後(外)に追加
      
      document.getElementById('btnToggleFamily')?.addEventListener('click', () => {
        isFamilyExpanded = !isFamilyExpanded;
        selectEmployee(empId); // 再描画
      });
    }
    
    // 家族削除イベントのバインド
    document.querySelectorAll('.btnDeleteFamily').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
        if (id) deleteFamily(id);
      });
    });
  } else {
    noFamilyMsg.style.display = 'block';
    const existingToggle = document.getElementById('btnToggleFamily');
    if (existingToggle) existingToggle.parentElement?.remove();
  }

  // 給与履歴の抽出と描画
  const mySalaries = appData.salaries.filter((s: any) => s['従業員ID'] === empId);
  // 日付の降順（新しい順）にソート
  mySalaries.sort((a: any, b: any) => new Date(b['変更・適用日']).getTime() - new Date(a['変更・適用日']).getTime());
  
  salaryList.innerHTML = '';
  if (mySalaries.length > 0) {
    noSalaryMsg.style.display = 'none';
    mySalaries.forEach((sal: any) => {
      const li = document.createElement('li');
      li.className = 'sub-item';
      
      let pdfLinkHtml = '-';
      
      // キーの揺れに対応して金額を取得する
      let monthly = sal['月給'] || sal['月給(円)'] || sal['基本給'] || '';
      let hourly = sal['時給'] || sal['時給(円)'] || '';
      let yearly = sal['年収'] || sal['年収(円)'] || '';
      let store = sal['所属店舗'] || sal['店舗'] || '-';

      // まだ見つからない場合のフォールバック（キー名に「月」「時」「年」を含むものを探す）
      if (!monthly) { const k = Object.keys(sal).find(k => k.includes('月')); if(k) monthly = sal[k]; }
      if (!hourly) { const k = Object.keys(sal).find(k => k.includes('時')); if(k) hourly = sal[k]; }
      if (!yearly) { const k = Object.keys(sal).find(k => k.includes('年')); if(k) yearly = sal[k]; }

      // PDFファイルへのリンクの最強フォールバック（どのカラム名でもURLの形をしていればPDFとみなす）
      let pdfUrl = '';
      for (const key of Object.keys(sal)) {
        if (sal[key] && String(sal[key]).startsWith('http')) {
          pdfUrl = String(sal[key]);
        }
      }
      
      if (pdfUrl) {
        pdfLinkHtml = `<a href="${pdfUrl}" target="_blank" style="color:#0D9488; font-weight:bold;">📄 ファイルを開く</a>`;
      }

      const applyDateKey = Object.keys(sal).find(k => k.includes('適用') || k.includes('変更') || k.includes('日')) || '変更・適用日';

      // 履歴ID（データ削除用）
      const recordIdKey = Object.keys(sal).find(k => k.includes('ID') && !k.includes('従業員')) || '履歴ID';
      const recordId = sal[recordIdKey] || '';

      li.innerHTML = `
        <div class="sub-item-title" style="display: flex; justify-content: space-between; width: 100%;">
          <span>${formatDateString(sal[applyDateKey])} 改定</span>
          <button class="delete-sal-btn" data-id="${recordId}" style="background: none; border: none; color: #EF4444; cursor: pointer; font-size: 0.85rem; font-weight: bold;">🗑️ 削除</button>
        </div>
        <div class="info-row"><span class="info-label">所属店舗</span><span class="info-value">${store}</span></div>
        <div class="info-row"><span class="info-label">月給 / 時給</span><span class="info-value">${formatCurrency(monthly)} / ${formatCurrency(hourly)}</span></div>
        <div class="info-row"><span class="info-label">年収</span><span class="info-value">${formatCurrency(yearly)}</span></div>
        <div class="info-row"><span class="info-label">添付ファイル</span><span class="info-value">${pdfLinkHtml}</span></div>
      `;
      salaryList.appendChild(li);
    });

    // 削除ボタンのイベント登録
    const deleteBtns = salaryList.querySelectorAll('.delete-sal-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const recordId = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
        if (!recordId) {
          alert('削除用IDが見つかりません');
          return;
        }
        if (confirm("本当にこの給与・人事履歴を削除しますか？\n（この操作は取り消せません）")) {
          await deleteSalaryRecord(recordId);
        }
      });
    });
  } else {
    noSalaryMsg.style.display = 'block';
  }
}

// 給与履歴の削除API通信
async function deleteSalaryRecord(recordId: string) {
  globalLoader.style.display = 'flex';
  try {
    const payload = {
      action: "deleteSalaryRecord",
      password: currentPassword,
      data: { recordId }
    };
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "success") {
      alert("削除しました！");
      await loadDashboardData(); // 再描画
    } else {
      throw new Error(result.message);
    }
  } catch (err: any) {
    alert("削除エラー: " + err.message);
  } finally {
    globalLoader.style.display = 'none';
  }
}

// 給与追加モーダル
btnOpenSalaryModal.addEventListener('click', () => {
  if (!currentSelectedEmpId) {
    alert("まずは左側のリストから、追加したい従業員を選んでください！");
    return;
  }
  const emp = appData.employees.find((e: any) => e['従業員ID'] === currentSelectedEmpId);
  salaryTargetEmpName.textContent = (emp['お名前'] || '') + " さんの履歴を追加";
  salaryForm.reset();
  
  // 今日の日付をセット
  const today = new Date().toISOString().split('T')[0];
  (document.getElementById('salApplyDate') as HTMLInputElement).value = today;
  
  salaryModal.style.display = 'flex';
});

btnCancelSalary.addEventListener('click', () => {
  salaryModal.style.display = 'none';
});

// 基本情報編集モーダルの処理
const btnOpenEmpEditModal = document.getElementById('btnOpenEmpEditModal') as HTMLButtonElement;
const empEditModal = document.getElementById('empEditModal') as HTMLDivElement;
const closeEmpEditModal = document.getElementById('closeEmpEditModal') as HTMLButtonElement;
const empEditForm = document.getElementById('empEditForm') as HTMLFormElement;
const editTargetEmpName = document.getElementById('editTargetEmpName') as HTMLParagraphElement;

btnOpenEmpEditModal.addEventListener('click', () => {
  if (!currentSelectedEmpId) return;
  const emp = appData.employees.find((e: any) => e['従業員ID'] === currentSelectedEmpId);
  editTargetEmpName.textContent = (emp['お名前'] || '') + " さんの情報を編集";
  empEditModal.style.display = 'flex';
});

closeEmpEditModal.addEventListener('click', () => {
  empEditModal.style.display = 'none';
});

empEditForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitEmpEditBtn') as HTMLButtonElement;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ 更新中...';

  try {
    const joinDate = (document.getElementById('editJoinDate') as HTMLInputElement).value;
    const leaveDate = (document.getElementById('editLeaveDate') as HTMLInputElement).value;
    const birthDate = (document.getElementById('editBirthDate') as HTMLInputElement).value;
    const address = (document.getElementById('editAddress') as HTMLInputElement).value;

    const payload = {
      action: "updateEmployeeAdmin",
      password: currentPassword,
      data: {
        empId: currentSelectedEmpId,
        joinDate,
        leaveDate,
        birthDate,
        address
      }
    };

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === "success") {
      alert("従業員情報を更新しました！");
      empEditModal.style.display = 'none';
      await loadDashboardData(); // データ再取得して再描画
    } else {
      throw new Error(result.message);
    }
  } catch (err: any) {
    alert("エラーが発生しました: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 更新する';
  }
});

// ファイルをBase64に変換する関数
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// 金額のカンマ自動付与ロジック
const commaInputs = document.querySelectorAll('.comma-input') as NodeListOf<HTMLInputElement>;
commaInputs.forEach(input => {
  input.addEventListener('input', (e) => {
    let val = (e.target as HTMLInputElement).value;
    // カンマや数字以外の文字を取り除く
    val = val.replace(/[^0-9]/g, '');
    if (val) {
      // 数値化して3桁カンマ区切りに
      (e.target as HTMLInputElement).value = Number(val).toLocaleString();
    } else {
      (e.target as HTMLInputElement).value = '';
    }
  });
});

// 給与情報の送信
salaryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  btnSubmitSalary.disabled = true;
  submitSalaryText.textContent = '⏳ 保存中...';
  submitSalaryLoader.style.display = 'inline-block';

  try {
    const applyDate = (document.getElementById('salApplyDate') as HTMLInputElement).value;
    const storeName = (document.getElementById('salStoreName') as HTMLInputElement).value;
    // カンマを取り除いて数値のみにする
    const monthlySalary = (document.getElementById('salMonthly') as HTMLInputElement).value.replace(/,/g, '');
    const hourlySalary = (document.getElementById('salHourly') as HTMLInputElement).value.replace(/,/g, '');
    const yearlySalary = (document.getElementById('salYearly') as HTMLInputElement).value.replace(/,/g, '');
    
    let pdfBase64 = "";
    let pdfName = "";
    const fileInput = document.getElementById('salPdfFile') as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      pdfBase64 = await fileToBase64(file);
      pdfName = currentSelectedEmpId + "_" + applyDate + "_" + file.name;
    }

    const payload = {
      action: "addSalaryRecord",
      password: currentPassword,
      data: {
        empId: currentSelectedEmpId,
        applyDate,
        storeName,
        monthlySalary,
        hourlySalary,
        yearlySalary,
        pdfBase64,
        pdfName
      }
    };

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === "success") {
      alert("保存しました！ダッシュボードを更新します。");
      salaryModal.style.display = 'none';
      await loadDashboardData(); // データを再取得して表示を更新
    } else {
      throw new Error(result.message);
    }
  } catch (err: any) {
    alert("エラーが発生しました: " + err.message);
  } finally {
    btnSubmitSalary.disabled = false;
    submitSalaryText.textContent = '保存する';
    submitSalaryLoader.style.display = 'none';
  }
});

// ------------------------------------------
// --- 家族 モーダル表示制御 ---
// ------------------------------------------
btnOpenFamilyModal.addEventListener('click', () => {
  if (!currentSelectedEmpId) {
    alert("左のリストから対象の従業員を選択してください。");
    return;
  }
  const emp = appData.employees.find((e: any) => e['従業員ID'] === currentSelectedEmpId);
  if (!emp) return;
  familyTargetEmpName.textContent = `${emp['お名前']} さんの家族`;
  familyModal.style.display = 'flex';
});

btnCancelFamily.addEventListener('click', () => {
  familyModal.style.display = 'none';
  familyForm.reset();
});

familyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentSelectedEmpId) return;
  
  submitFamilyText.style.display = 'none';
  submitFamilyLoader.style.display = 'inline-block';
  (document.getElementById('btnSubmitFamily') as HTMLButtonElement).disabled = true;

  const livingRadios = document.getElementsByName('famLiving') as NodeListOf<HTMLInputElement>;
  let livingVal = "";
  livingRadios.forEach(r => { if (r.checked) livingVal = r.value; });

  let birthStr = "";
  if (famAddUnknownCheck.checked) {
    birthStr = "不明(" + famAddApproxAge.value + "歳)";
  } else {
    birthStr = `${famAddYear.value}-${famAddMonth.value}-${famAddDay.value}`;
  }

  const payload = {
    action: "addFamily",
    password: currentPassword,
    empId: currentSelectedEmpId,
    data: {
      relation: famRelationInput.value,
      birthdate: birthStr,
      living: livingVal
    }
  };

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "success") {
      familyModal.style.display = 'none';
      familyForm.reset();
      await loadDashboardData(); // 再取得・描画
    } else {
      alert("エラー: " + result.message);
    }
  } catch (err) {
    alert("通信に失敗しました。");
  } finally {
    submitFamilyText.style.display = 'inline';
    submitFamilyLoader.style.display = 'none';
    (document.getElementById('btnSubmitFamily') as HTMLButtonElement).disabled = false;
  }
});

// --- 家族 削除 ---
async function deleteFamily(familyId: string) {
  if (!confirm("本当にこの家族情報を削除しますか？\n(一度消すと元に戻せません)")) return;
  
  globalLoader.style.display = 'flex';
  const payload = { action: "deleteFamily", password: currentPassword, familyId: familyId };
  
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "success") {
      await loadDashboardData();
    } else {
      alert("エラー: " + result.message);
    }
  } catch(err) {
    alert("削除の通信に失敗しました。");
  } finally {
    globalLoader.style.display = 'none';
  }
}

// ------------------------------------------
// --- その他 UIイベント (住所履歴・郵便番号など) ---
// ------------------------------------------
btnToggleAddressHistory.addEventListener('click', () => {
  if (addressHistoryContainer.style.display === 'none') {
    addressHistoryContainer.style.display = 'block';
    btnToggleAddressHistory.textContent = '▲ 閉じる';
  } else {
    addressHistoryContainer.style.display = 'none';
    btnToggleAddressHistory.textContent = '📜 過去の履歴';
  }
});

btnEditSearchZip.addEventListener('click', async () => {
  const zip = editEmpZip.value.replace(/-/g, '');
  if (zip.length !== 7) {
    alert('郵便番号はハイフンなしの7桁で入力してください。');
    return;
  }
  const orgText = btnEditSearchZip.textContent;
  btnEditSearchZip.textContent = "検索中...";
  btnEditSearchZip.disabled = true;
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const data = await res.json();
    if (data.status === 200 && data.results) {
      const addr = data.results[0];
      const editAddress = document.getElementById('editAddress') as HTMLInputElement;
      editAddress.value = "〒" + zip + " " + addr.address1 + addr.address2 + addr.address3;
    } else {
      alert('住所が見つかりませんでした。郵便番号を確認してください。');
    }
  } catch (err) {
    alert('通信エラーが発生しました。');
  } finally {
    btnEditSearchZip.textContent = orgText;
    btnEditSearchZip.disabled = false;
  }
});

// 家族モーダルを開いたときのドラムロール初期化
btnOpenFamilyModal.addEventListener('click', () => {
  famRelationInput.value = "";
  famAddYear.innerHTML = '<option value="">年</option>';
  famAddMonth.innerHTML = '<option value="">月</option>';
  famAddDay.innerHTML = '<option value="">日</option>';

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1930; y--) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = String(y);
    famAddYear.appendChild(opt);
  }
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = String(m).padStart(2, '0');
    famAddMonth.appendChild(opt);
  }
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = String(d).padStart(2, '0');
    famAddDay.appendChild(opt);
  }

  famAddUnknownCheck.checked = false;
  famEditDateGroup.style.display = 'flex';
  famAddApproxAgeGroup.style.display = 'none';
  famAddYear.setAttribute('required', 'true');
  famAddMonth.setAttribute('required', 'true');
  famAddDay.setAttribute('required', 'true');
  famAddApproxAge.removeAttribute('required');
  famAddApproxAge.value = '';
});

famAddUnknownCheck.addEventListener('change', (e) => {
  const isChecked = (e.target as HTMLInputElement).checked;
  if (isChecked) {
    famEditDateGroup.style.display = 'none';
    famAddYear.removeAttribute('required');
    famAddMonth.removeAttribute('required');
    famAddDay.removeAttribute('required');
    famAddApproxAgeGroup.style.display = 'block';
    famAddApproxAge.setAttribute('required', 'true');
  } else {
    famAddApproxAgeGroup.style.display = 'none';
    famAddApproxAge.removeAttribute('required');
    famAddApproxAge.value = '';
    famEditDateGroup.style.display = 'flex';
    famAddYear.setAttribute('required', 'true');
    famAddMonth.setAttribute('required', 'true');
    famAddDay.setAttribute('required', 'true');
  }
});
