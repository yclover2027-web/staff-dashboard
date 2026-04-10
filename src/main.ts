import './style.css'

// GASのURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxLyPhC1vbqpAaFFVJEW4Ava1ls4hrCUzU9ME5d9T73kIMsXlztQ7fYphdPt23bViT_Pg/exec";

// --- DOM Elements ---
const topMenu = document.getElementById('topMenu') as HTMLDivElement;
const registrationForm = document.getElementById('registrationForm') as HTMLFormElement;
const formTypeInput = document.getElementById('formType') as HTMLInputElement;
const formTitle = document.getElementById('formTitle') as HTMLHeadingElement;
const successMessage = document.getElementById('successMessage') as HTMLDivElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

const btnNew = document.getElementById('btnNew') as HTMLButtonElement;
const btnUpdate = document.getElementById('btnUpdate') as HTMLButtonElement;
const btnBack = document.getElementById('btnBack') as HTMLButtonElement;
const btnReload = document.getElementById('btnReload') as HTMLButtonElement;

const familyContainer = document.getElementById('familyContainer') as HTMLDivElement;
const addFamilyBtn = document.getElementById('addFamilyBtn') as HTMLButtonElement;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const submitText = document.getElementById('submitText') as HTMLSpanElement;
const submitLoader = document.getElementById('submitLoader') as HTMLDivElement;

const empZipSearch = document.getElementById('empZipSearch') as HTMLButtonElement;
const empZip = document.getElementById('empZip') as HTMLInputElement;
const empAddress = document.getElementById('empAddress') as HTMLInputElement;

const emgZipSearch = document.getElementById('emgZipSearch') as HTMLButtonElement;
const emgName = document.getElementById('emgName') as HTMLInputElement;
const emgRelation = document.getElementById('emgRelation') as HTMLInputElement;
const emgPhone = document.getElementById('emgPhone') as HTMLInputElement;
const emgZip = document.getElementById('emgZip') as HTMLInputElement;
const emgAddress = document.getElementById('emgAddress') as HTMLInputElement;

const emgSameAsEmp = document.getElementById('emgSameAsEmp') as HTMLInputElement;
const emgAddressGroup = document.getElementById('emgAddressGroup') as HTMLDivElement;

const btnShowFamilyTree = document.getElementById('btnShowFamilyTree') as HTMLButtonElement;
const familyTreeModal = document.getElementById('familyTreeModal') as HTMLDivElement;
const closeModal = document.getElementById('closeModal') as HTMLSpanElement;

let familyCount = 0;

// --- 日付ヘルパー関数 ---
function calculateAge(year: string, month: string, day: string): number | null {
  if (!year || !month || !day) return null;
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getJapaneseYear(year: number): string {
  if (year >= 2019) return year === 2019 ? '令和元' : `令和${year - 2018}`;
  if (year >= 1989) return year === 1989 ? '平成元' : `平成${year - 1988}`;
  if (year >= 1926) return year === 1926 ? '昭和元' : `昭和${year - 1925}`;
  if (year >= 1912) return year === 1912 ? '大正元' : `大正${year - 1911}`;
  return '';
}

function initDatePicker(yearSel: HTMLSelectElement, monthSel: HTMLSelectElement, daySel: HTMLSelectElement, defaultYear: number | null = 1988) {
  yearSel.innerHTML = '<option value="">（選択）</option>';
  monthSel.innerHTML = '<option value="">（選択）</option>';
  daySel.innerHTML = '<option value="">（選択）</option>';

  const currentYear = new Date().getFullYear();

  // 年: 1930年〜今年まで
  for (let y = currentYear; y >= 1930; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    const wareki = getJapaneseYear(y);
    opt.textContent = `${y} (${wareki}年)`;
    if (y === defaultYear) opt.selected = true;
    yearSel.appendChild(opt);
  }

  // 月
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = String(m).padStart(2, '0');
    opt.textContent = String(m);
    if (defaultYear && m === 1) opt.selected = true;
    monthSel.appendChild(opt);
  }

  // 日
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = String(d);
    if (defaultYear && d === 1) opt.selected = true;
    daySel.appendChild(opt);
  }
}

const empYear = document.getElementById('empYear') as HTMLSelectElement;
const empMonth = document.getElementById('empMonth') as HTMLSelectElement;
const empDay = document.getElementById('empDay') as HTMLSelectElement;
const empAgeDisplay = document.getElementById('empAgeDisplay') as HTMLDivElement;

initDatePicker(empYear, empMonth, empDay, null); // 変更モードのために初期値は必ず空にする

function updateEmpAge() {
  const age = calculateAge(empYear.value, empMonth.value, empDay.value);
  if (age !== null) {
    empAgeDisplay.textContent = `（現在 ${age}歳）`;
  } else {
    empAgeDisplay.textContent = '';
  }
}
empYear.addEventListener('change', updateEmpAge);
empMonth.addEventListener('change', updateEmpAge);
empDay.addEventListener('change', updateEmpAge);

// --- 必須・任意コントロール・連動 ---
function setFieldRequired(id: string | HTMLInputElement | HTMLSelectElement, isRequired: boolean) {
  const el = typeof id === 'string' ? document.getElementById(id) as HTMLInputElement | HTMLSelectElement : id;
  if (!el) return;

  if (isRequired) {
    el.setAttribute('required', 'true');
  } else {
    el.removeAttribute('required');
  }

  // ラベルのバッジ書き換え
  let label: HTMLLabelElement | null = null;
  if (el.id) label = document.querySelector(`label[for="${el.id}"]`);
  if (!label && el.closest('.form-group')) {
    label = el.closest('.form-group')!.querySelector('label');
  }

  // 特殊なラベル(生年月日など)への対応
  if (!label && el.id === 'empYear') label = document.getElementById('labelEmpBirth') as HTMLLabelElement;

  if (label) {
    const badge = label.querySelector('.req-badge') as HTMLSpanElement;
    if (badge) {
      badge.className = `req-badge ${isRequired ? 'required' : 'optional'}`;
      badge.textContent = isRequired ? '必須' : '任意';
    }
  }
}

function checkEmpBirthLink() {
  if (formTypeInput.value !== 'update') return;
  const hasValue = empYear.value !== '' || empMonth.value !== '' || empDay.value !== '';
  setFieldRequired(empYear, hasValue);
  setFieldRequired(empMonth, hasValue);
  setFieldRequired(empDay, hasValue);
}

function checkEmpAddressLink() {
  if (formTypeInput.value !== 'update') return;
  const hasValue = empZip.value.length > 0 || empAddress.value.length > 0;
  setFieldRequired(empZip, hasValue);
  setFieldRequired(empAddress, hasValue);
}

function checkEmgLink() {
  if (formTypeInput.value !== 'update') return;
  const hasValue = emgName.value.length > 0 || emgRelation.value.length > 0 || emgPhone.value.length > 0 || emgZip.value.length > 0 || emgAddress.value.length > 0;
  setFieldRequired(emgName, hasValue);
  setFieldRequired(emgRelation, hasValue);
  setFieldRequired(emgPhone, hasValue);
  if (!emgSameAsEmp.checked) {
    setFieldRequired(emgZip, hasValue);
    setFieldRequired(emgAddress, hasValue);
  }
}

// イベントリスナーの登録
[empYear, empMonth, empDay].forEach(el => el.addEventListener('change', checkEmpBirthLink));
[empZip, empAddress].forEach(el => el.addEventListener('input', checkEmpAddressLink));
[emgName, emgRelation, emgPhone, emgZip, emgAddress].forEach(el => el.addEventListener('input', checkEmgLink));

// フォームのリセットと必須項目の設定
function setupFormMode(mode: 'new' | 'update') {
  registrationForm.reset();
  familyContainer.innerHTML = ''; // 家族をリセット
  updateEmpAge();

  if (mode === 'new') {
    // 新規登録：すべて必須
    ['empYear', 'empMonth', 'empDay', 'empZip', 'empAddress', 'emgName', 'emgRelation', 'emgPhone', 'emgZip', 'emgAddress'].forEach(id => {
      setFieldRequired(id, true);
    });
  } else {
    // 変更：名前以外は任意
    ['empYear', 'empMonth', 'empDay', 'empZip', 'empAddress', 'emgName', 'emgRelation', 'emgPhone', 'emgZip', 'emgAddress'].forEach(id => {
      setFieldRequired(id, false);
    });
  }

  emgAddressGroup.style.display = 'block';
}


// --- 画面切り替え ---
btnNew.addEventListener('click', () => {
  formTypeInput.value = 'new';
  formTitle.textContent = '✨ 新規登録フォーム';
  setupFormMode('new');

  // 新規登録の時は初期値を1988/01/01にする
  empYear.value = "1988";
  empMonth.value = "01";
  empDay.value = "01";
  updateEmpAge();

  topMenu.style.display = 'none';
  registrationForm.style.display = 'block';
  registrationForm.classList.add('slide-in');
});

btnUpdate.addEventListener('click', () => {
  formTypeInput.value = 'update';
  formTitle.textContent = '🔄 情報変更届フォーム';
  setupFormMode('update');
  topMenu.style.display = 'none';
  registrationForm.style.display = 'block';
  registrationForm.classList.add('slide-in');
});

btnBack.addEventListener('click', () => {
  registrationForm.style.display = 'none';
  topMenu.style.display = 'block';
  topMenu.classList.add('slide-in');
});

btnReload.addEventListener('click', () => {
  window.location.reload();
});

// --- 郵便番号検索 API ---
async function searchAddress(zipInput: HTMLInputElement, addressInput: HTMLInputElement) {
  const zip = zipInput.value.replace(/-/g, '');
  if (zip.length !== 7) {
    alert('郵便番号はハイフンなしの7桁の数字で入力してください。（例：1000001）');
    return;
  }

  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const data = await res.json();
    if (data.status === 200 && data.results) {
      const result = data.results[0];
      addressInput.value = result.address1 + result.address2 + result.address3;
      // 住所が自動入力されたら連動チェックを発火
      addressInput.dispatchEvent(new Event('input'));
    } else {
      alert('住所が見つかりませんでした。');
    }
  } catch (err) {
    alert('検索に失敗しました。直接入力してください。');
  }
}

empZipSearch.addEventListener('click', () => searchAddress(empZip, empAddress));
emgZipSearch.addEventListener('click', () => searchAddress(emgZip, emgAddress));

// --- 緊急連絡先の住所スキップ処理 ---
emgSameAsEmp.addEventListener('change', (e) => {
  const isChecked = (e.target as HTMLInputElement).checked;
  if (isChecked) {
    emgAddressGroup.style.display = 'none';
    setFieldRequired(emgZip, false);
    setFieldRequired(emgAddress, false);
  } else {
    emgAddressGroup.style.display = 'block';
    if (formTypeInput.value === 'new') {
      setFieldRequired(emgZip, true);
      setFieldRequired(emgAddress, true);
    } else {
      // 変更モードの場合、連動ロジックに任せる
      checkEmgLink();
    }
  }
});


// --- モーダル (親等早見表) ---
btnShowFamilyTree.addEventListener('click', () => {
  familyTreeModal.style.display = 'flex';
});
closeModal.addEventListener('click', () => {
  familyTreeModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === familyTreeModal) familyTreeModal.style.display = 'none';
});


// --- 家族入力フィールドの追加 ---
function addFamilyField() {
  familyCount++;
  const fieldId = `family-${familyCount}`;

  const div = document.createElement('div');
  div.className = 'family-item slide-in';
  div.id = fieldId;

  div.innerHTML = `
    <div class="family-item-header">
      <h4>ご家族 ${familyCount}</h4>
      <button type="button" class="remove-btn" data-target="${fieldId}">✕ 外す</button>
    </div>
    <div class="form-row">
      <div class="form-group flex-1">
        <label>続き柄（関係） <span class="req-badge required">必須</span></label>
        <select name="famRelation[]" class="fam-relation" required>
          <option value="">（えらんでください）</option>
          <option value="配偶者">配偶者</option>
          <option value="子">子</option>
          <option value="父">父</option>
          <option value="母">母</option>
          <option value="義父">義父</option>
          <option value="義母">義母</option>
          <option value="祖父母">祖父母</option>
          <option value="孫">孫</option>
          <option value="兄弟姉妹">兄弟姉妹</option>
          <option value="その他">その他</option>
        </select>
      </div>
    </div>
    
    <!-- 生年月日 or 概算年齢 -->
    <div class="form-row" style="align-items: flex-start;">
      <div class="form-group flex-1" id="birthDateGroup-${familyCount}">
        <label>生年月日 <span class="req-badge required">必須</span></label>
        <div class="date-picker-group">
          <select class="fam-year" required></select> <span class="date-label">年</span>
          <select class="fam-month" required></select> <span class="date-label">月</span>
          <select class="fam-day" required></select> <span class="date-label">日</span>
        </div>
        <div class="fam-age-display" style="color: #0D9488; font-weight: 700; margin-top: 0.5rem; text-align: right; font-size: 0.95rem;"></div>
      </div>
      
      <div class="form-group flex-1" id="approxAgeGroup-${familyCount}" style="display:none;">
        <label>だいたいの年齢 <span class="req-badge required">必須</span></label>
        <input type="number" name="famApproxAge[]" class="fam-approx-age" min="0" max="150" placeholder="例: 65" />
      </div>
    </div>
    
    <!-- わからない場合の保険チェックボックス -->
    <div class="form-group mb-2">
      <label class="checkbox-label" style="font-size:0.85rem; color:#6B7280; font-weight:normal;">
        <input type="checkbox" class="unknown-age-check" data-id="${familyCount}"> 
        生年月日がわからない（年齢を手入力する）
      </label>
    </div>

    <div class="form-group mb-0">
      <label>同居の有無 <span class="req-badge required">必須</span></label>
      <div class="radio-group" style="margin-top: 0.5rem;">
        <label class="radio-label">
          <input type="radio" name="famLivingTogether-${familyCount}" value="はい" required> はい
        </label>
        <label class="radio-label">
          <input type="radio" name="famLivingTogether-${familyCount}" value="いいえ"> いいえ
        </label>
      </div>
    </div>
  `;

  familyContainer.appendChild(div);

  const ySel = div.querySelector('.fam-year') as HTMLSelectElement;
  const mSel = div.querySelector('.fam-month') as HTMLSelectElement;
  const dSel = div.querySelector('.fam-day') as HTMLSelectElement;
  const famAgeDisplay = div.querySelector('.fam-age-display') as HTMLDivElement;

  initDatePicker(ySel, mSel, dSel, null); // ここも空をデフォルトにする

  function updateFamAge() {
    const age = calculateAge(ySel.value, mSel.value, dSel.value);
    if (age !== null) {
      famAgeDisplay.textContent = `（現在 ${age}歳）`;
    } else {
      famAgeDisplay.textContent = '';
    }
  }
  ySel.addEventListener('change', updateFamAge);
  mSel.addEventListener('change', updateFamAge);
  dSel.addEventListener('change', updateFamAge);
  updateFamAge();

  // 生年月日⇔年齢 入力切り替えのロジック
  const checkUnknown = div.querySelector('.unknown-age-check') as HTMLInputElement;
  const bdGroup = div.querySelector(`#birthDateGroup-${familyCount}`) as HTMLDivElement;
  const ageGroup = div.querySelector(`#approxAgeGroup-${familyCount}`) as HTMLDivElement;
  const ageInput = div.querySelector('.fam-approx-age') as HTMLInputElement;

  checkUnknown.addEventListener('change', (e) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    if (isChecked) {
      bdGroup.style.display = 'none';
      ySel.removeAttribute('required');
      mSel.removeAttribute('required');
      dSel.removeAttribute('required');

      ageGroup.style.display = 'block';
      ageInput.setAttribute('required', 'true');
    } else {
      ageGroup.style.display = 'none';
      ageInput.removeAttribute('required');
      ageInput.value = ''; // クリア

      bdGroup.style.display = 'block';
      ySel.setAttribute('required', 'true');
      mSel.setAttribute('required', 'true');
      dSel.setAttribute('required', 'true');
    }
  });

  // 削除ボタン
  const removeBtn = div.querySelector('.remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      const targetId = (e.target as HTMLButtonElement).dataset.target;
      if (targetId) {
        const item = document.getElementById(targetId);
        if (item) {
          item.classList.add('slide-out');
          item.addEventListener('animationend', () => {
            item.remove();
          }, { once: true });
        }
      }
    });
  }
}

addFamilyBtn.addEventListener('click', addFamilyField);

// --- フォーム送信 ---
registrationForm.addEventListener('submit', async (e: Event) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitText.style.display = 'none';
  submitLoader.style.display = 'block';
  errorMessage.style.display = 'none';

  try {
    const formData = new FormData(registrationForm);

    // 従業員の誕生日を結合 (空なら空)
    const empY = formData.get('empYear');
    const empM = formData.get('empMonth');
    const empD = formData.get('empDay');
    const empBirthDateStr = (empY && empM && empD) ? `${empY}-${empM}-${empD}` : '';

    // 家族情報
    const families: any[] = [];
    const familyItems = document.querySelectorAll('.family-item');

    familyItems.forEach((item) => {
      const relationSelect = item.querySelector('.fam-relation') as HTMLSelectElement;
      const radioChecked = item.querySelector('input[type="radio"]:checked') as HTMLInputElement;

      const checkUnknown = item.querySelector('.unknown-age-check') as HTMLInputElement;
      const ageInput = item.querySelector('.fam-approx-age') as HTMLInputElement;

      const ySel = item.querySelector('.fam-year') as HTMLSelectElement;
      const mSel = item.querySelector('.fam-month') as HTMLSelectElement;
      const dSel = item.querySelector('.fam-day') as HTMLSelectElement;

      // エラーで弾かれないよう、取得できたものは何でも送る超安全設計
      let relationVal = relationSelect ? relationSelect.value : "未入力";
      let livingTogether = radioChecked ? radioChecked.value : "不明";

      let birth = "";
      if (checkUnknown && checkUnknown.checked) {
        birth = "不明(" + (ageInput ? ageInput.value : "") + "歳)";
      } else {
        birth = (ySel && ySel.value && mSel && mSel.value && dSel && dSel.value)
          ? `${ySel.value}-${mSel.value}-${dSel.value}`
          : '';
      }

      // 家族の枠が存在すれば確実にデータとして送る
      if (relationSelect) {
        families.push({
          relation: relationVal,
          living_together: livingTogether,
          birthdate: birth
        });
      }
    });

    const empZipStr = formData.get('empZip') ? `〒${formData.get('empZip')} ` : '';
    const emgZipStr = emgSameAsEmp.checked ? empZipStr : (formData.get('emgZip') ? `〒${formData.get('emgZip')} ` : '');

    const payload = {
      action: "registerEmployee",
      data: {
        formType: formData.get('formType'),
        name: formData.get('empName'),
        nameKana: formData.get('empNameKana'),
        birthdate: empBirthDateStr,
        address: empZipStr + (formData.get('empAddress') || ''),
        emergency_name: formData.get('emgName') || '',
        emergency_relation: formData.get('emgRelation') || '',
        emergency_phone: formData.get('emgPhone') || '',
        emergency_address: emgZipStr + (emgSameAsEmp.checked ? (formData.get('empAddress') || '') : (formData.get('emgAddress') || '')),
        families: families
      }
    };

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === 'success') {
      window.scrollTo(0, 0);
      registrationForm.style.display = 'none';
      successMessage.style.display = 'flex';
    } else {
      throw new Error(result.message || 'Server returned error');
    }

  } catch (error) {
    console.error('送信エラー:', error);
    errorMessage.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitText.style.display = 'inline';
    submitLoader.style.display = 'none';
  }
});

