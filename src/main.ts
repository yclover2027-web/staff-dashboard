import './style.css'

// GASのURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxSSI2QyX2bfr_Yfa1Fo0IK6UliQGhw9_iu8gsMvmHc8ZKHAZAqNipS0PoU6jNOKJKjRQ/exec";

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
const emgZip = document.getElementById('emgZip') as HTMLInputElement;
const emgAddress = document.getElementById('emgAddress') as HTMLInputElement;

const btnShowFamilyTree = document.getElementById('btnShowFamilyTree') as HTMLButtonElement;
const familyTreeModal = document.getElementById('familyTreeModal') as HTMLDivElement;
const closeModal = document.getElementById('closeModal') as HTMLSpanElement;

let familyCount = 0;

// --- 日付ヘルパー関数 ---
function getJapaneseYear(year: number): string {
  if (year >= 2019) return year === 2019 ? '令和元' : `令和${year - 2018}`;
  if (year >= 1989) return year === 1989 ? '平成元' : `平成${year - 1988}`;
  if (year >= 1926) return year === 1926 ? '昭和元' : `昭和${year - 1925}`;
  if (year >= 1912) return year === 1912 ? '大正元' : `大正${year - 1911}`;
  return '';
}

function initDatePicker(yearSel: HTMLSelectElement, monthSel: HTMLSelectElement, daySel: HTMLSelectElement, defaultYear = 1988) {
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
    if (m === 1) opt.selected = true; // デフォルト1月
    monthSel.appendChild(opt);
  }
  
  // 日
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = String(d);
    if (d === 1) opt.selected = true; // デフォルト1日
    daySel.appendChild(opt);
  }
}

// 従業員用の生年月日セレクトを初期化（デフォルト1988年1月1日）
const empYear = document.getElementById('empYear') as HTMLSelectElement;
const empMonth = document.getElementById('empMonth') as HTMLSelectElement;
const empDay = document.getElementById('empDay') as HTMLSelectElement;
initDatePicker(empYear, empMonth, empDay, 1988);


// --- 画面切り替え ---
btnNew.addEventListener('click', () => {
  formTypeInput.value = 'new';
  formTitle.textContent = '✨ 新規登録フォーム';
  topMenu.style.display = 'none';
  registrationForm.style.display = 'block';
  registrationForm.classList.add('slide-in');
});

btnUpdate.addEventListener('click', () => {
  formTypeInput.value = 'update';
  formTitle.textContent = '🔄 情報変更届フォーム';
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
    } else {
      alert('住所が見つかりませんでした。');
    }
  } catch (err) {
    alert('検索に失敗しました。直接入力してください。');
  }
}

empZipSearch.addEventListener('click', () => searchAddress(empZip, empAddress));
emgZipSearch.addEventListener('click', () => searchAddress(emgZip, emgAddress));


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
        <label>続き柄（関係） <span class="required">必須</span></label>
        <select name="famRelation[]" required>
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
        <label>生年月日 <span class="required">必須</span></label>
        <div class="date-picker-group">
          <select class="fam-year" required></select> <span class="date-label">年</span>
          <select class="fam-month" required></select> <span class="date-label">月</span>
          <select class="fam-day" required></select> <span class="date-label">日</span>
        </div>
      </div>
      
      <div class="form-group flex-1" id="approxAgeGroup-${familyCount}" style="display:none;">
        <label>だいたいの年齢 <span class="required">必須</span></label>
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
      <label>同居の有無 <span class="required">必須</span></label>
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

  // 家族用のセレクトボックスを初期化
  const ySel = div.querySelector('.fam-year') as HTMLSelectElement;
  const mSel = div.querySelector('.fam-month') as HTMLSelectElement;
  const dSel = div.querySelector('.fam-day') as HTMLSelectElement;
  initDatePicker(ySel, mSel, dSel, 1988);
  
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
    
    // 従業員の誕生日を結合 (YYYY-MM-DD)
    const empBirthDateStr = `${formData.get('empYear')}-${formData.get('empMonth')}-${formData.get('empDay')}`;

    // 従業員情報
    const employee = {
      name: formData.get('empName'),
      birthDate: empBirthDateStr,
      zip: formData.get('empZip'),
      address: formData.get('empAddress')
    };

    // 緊急連絡先
    const emergencyInfo = {
      name: formData.get('emgName'),
      relation: formData.get('emgRelation'),
      phone: formData.get('emgPhone'),
      zip: formData.get('emgZip'),
      address: formData.get('emgAddress')
    };
    
    // 家族情報
    const families: any[] = [];
    const familyItems = document.querySelectorAll('.family-item');
    
    familyItems.forEach((item) => {
      const relationSelect = item.querySelector('select[name="famRelation[]"]') as HTMLSelectElement;
      const radioChecked = item.querySelector('input[type="radio"]:checked') as HTMLInputElement;
      
      const checkUnknown = item.querySelector('.unknown-age-check') as HTMLInputElement;
      const ageInput = item.querySelector('.fam-approx-age') as HTMLInputElement;
      
      const ySel = item.querySelector('.fam-year') as HTMLSelectElement;
      const mSel = item.querySelector('.fam-month') as HTMLSelectElement;
      const dSel = item.querySelector('.fam-day') as HTMLSelectElement;
      
      if (relationSelect && radioChecked) {
        const famData: any = {
          relation: relationSelect.value,
          isLivingTogether: radioChecked.value
        };

        // 生年月日か年齢か
        if (checkUnknown && checkUnknown.checked) {
          famData.approxAge = ageInput.value; // 概算年齢
        } else {
          famData.birthDate = `${ySel.value}-${mSel.value}-${dSel.value}`;  // 結合した生年月日
        }
        
        families.push(famData);
      }
    });

    const payload = {
      formType: formData.get('formType'), // 'new' or 'update'
      employee,
      emergencyInfo,
      families
    };

    // 送信
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      // GASのCORSを回避するためのおまじない
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      window.scrollTo(0,0);
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
