const GAS_URL = "https://script.google.com/macros/s/AKfycbzSmzgZhynNx8i6Xjq6qpednQEjULRAFcHG_8E0eOyCOZJynMlH_oA4ho7h7Bf21L94Lw/exec";

// DOM Elements
const loginScreen = document.getElementById('loginScreen') as HTMLDivElement;
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const adminPasswordInput = document.getElementById('adminPassword') as HTMLInputElement;
const loginError = document.getElementById('loginError') as HTMLDivElement;

const dashboard = document.getElementById('dashboard') as HTMLDivElement;
const empList = document.getElementById('empList') as HTMLUListElement;
const btnRefresh = document.getElementById('btnRefresh') as HTMLButtonElement;

const globalLoader = document.getElementById('globalLoader') as HTMLDivElement;

// Detail Area
const empDetailContainer = document.getElementById('empDetailContainer') as HTMLDivElement;
const welcomeMessage = document.getElementById('welcomeMessage') as HTMLDivElement;
const detailName = document.getElementById('detailName') as HTMLHeadingElement;
const detailEmpId = document.getElementById('detailEmpId') as HTMLSpanElement;
const detailBirth = document.getElementById('detailBirth') as HTMLSpanElement;
const detailJoinDate = document.getElementById('detailJoinDate') as HTMLSpanElement;
const detailLeaveDate = document.getElementById('detailLeaveDate') as HTMLSpanElement;
const detailAddress = document.getElementById('detailAddress') as HTMLSpanElement;
const detailEmgName = document.getElementById('detailEmgName') as HTMLSpanElement;
const detailEmgPhone = document.getElementById('detailEmgPhone') as HTMLSpanElement;
const detailEmgAddress = document.getElementById('detailEmgAddress') as HTMLSpanElement;

// Sub Lists
const familyList = document.getElementById('familyList') as HTMLUListElement;
const noFamilyMsg = document.getElementById('noFamilyMsg') as HTMLDivElement;
const salaryList = document.getElementById('salaryList') as HTMLUListElement;
const noSalaryMsg = document.getElementById('noSalaryMsg') as HTMLDivElement;

// Modal
const btnOpenSalaryModal = document.getElementById('btnOpenSalaryModal') as HTMLButtonElement;
const salaryModal = document.getElementById('salaryModal') as HTMLDivElement;
const closeSalaryModal = document.getElementById('closeSalaryModal') as HTMLButtonElement;
const salaryForm = document.getElementById('salaryForm') as HTMLFormElement;
const salaryTargetEmpName = document.getElementById('salaryTargetEmpName') as HTMLParagraphElement;
const submitSalaryBtn = document.getElementById('submitSalaryBtn') as HTMLButtonElement;

// State
let appData: any = { employees: [], families: [], salaries: [] };
let currentPassword = "";
let currentSelectedEmpId = "";

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
  appData.employees.forEach((emp: any) => {
    const li = document.createElement('li');
    li.className = `emp-item ${emp['従業員ID'] === currentSelectedEmpId ? 'active' : ''}`;
    li.textContent = emp['お名前'] || '名前なし';
    li.addEventListener('click', () => selectEmployee(emp['従業員ID']));
    empList.appendChild(li);
  });
}

// 従業員詳細の表示
function selectEmployee(empId: string) {
  currentSelectedEmpId = empId;
  renderEmployeeList(); // アクティブ表示更新

  const emp = appData.employees.find((e: any) => e['従業員ID'] === empId);
  if (!emp) return;

  // 基本情報編集用データをセット
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

  // 緊急連絡先
  detailEmgName.textContent = `${emp['緊急連絡先_名前'] || '-'} (${emp['緊急連絡先_続柄'] || '-'})`;
  detailEmgPhone.textContent = emp['緊急連絡先_電話番号'] || '-';
  detailEmgAddress.textContent = emp['緊急連絡先_住所'] || '-';

  // 家族リストの抽出と描画
  const myFamilies = appData.families.filter((f: any) => f['従業員ID'] === empId);
  familyList.innerHTML = '';
  if (myFamilies.length > 0) {
    noFamilyMsg.style.display = 'none';
    myFamilies.forEach((fam: any) => {
      const li = document.createElement('li');
      li.className = 'sub-item';
      const famAge = calculateAge(fam['生年月日']);
      const famFormattedBirth = formatDateString(fam['生年月日']);
      li.innerHTML = `
        <div class="sub-item-title">${fam['続柄']}</div>
        <div class="info-row"><span class="info-label">生年月日(年齢)</span><span class="info-value">${famFormattedBirth} (${famAge}歳)</span></div>
        <div class="info-row"><span class="info-label">同居</span><span class="info-value">${fam['同居の有無']}</span></div>
      `;
      familyList.appendChild(li);
    });
  } else {
    noFamilyMsg.style.display = 'block';
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

closeSalaryModal.addEventListener('click', () => {
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
  
  submitSalaryBtn.disabled = true;
  submitSalaryBtn.textContent = '⏳ 保存中...';

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
    submitSalaryBtn.disabled = false;
    submitSalaryBtn.textContent = '💾 保存して蓄積する';
  }
});
