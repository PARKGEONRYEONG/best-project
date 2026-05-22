import { createClient } from '@supabase/supabase-js';

// ===== Supabase 초기화 =====
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase 설정이 없습니다. .env.local 파일에서 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== DOM 요소 가져오기 =====
const goalForm = document.getElementById('goalForm');
const goalInput = document.getElementById('goalInput');
const categorySelect = document.getElementById('categorySelect');
const goalsContainer = document.getElementById('goalsContainer');

// ===== 상태 관리 =====
let allGoals = [];

// ===== Supabase에서 모든 일정 조회하기 =====
async function fetchAllGoals() {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 데이터 조회 실패:', error.message);
      return;
    }

    allGoals = data || [];
    renderGoals();
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  }
}

// ===== 화면에 일정 리스트 렌더링 =====
function renderGoals() {
  goalsContainer.innerHTML = '';

  if (allGoals.length === 0) {
    goalsContainer.innerHTML = '<div class="empty-state">일정이 없습니다. 새로운 일정을 추가해주세요!</div>';
    return;
  }

  allGoals.forEach(goal => {
    const goalElement = createGoalElement(goal);
    goalsContainer.appendChild(goalElement);
  });
}

// ===== 일정 요소 생성 =====
function createGoalElement(goal) {
  const goalItem = document.createElement('div');
  goalItem.className = `goal-item ${goal.is_active ? '' : 'completed'}`;
  goalItem.id = `goal-${goal.id}`;

  goalItem.innerHTML = `
    <div class="goal-content">
      <span class="goal-category">${goal.category || '기타'}</span>
      <span class="goal-title">${escapeHtml(goal.title)}</span>
    </div>
    <div class="goal-status ${goal.is_active ? 'active' : 'completed'}">
      ${goal.is_active ? '진행 중' : '✓ 완료'}
    </div>
  `;

  // 일정 클릭 시 상태 토글
  goalItem.addEventListener('click', async () => {
    await toggleGoalStatus(goal);
  });

  return goalItem;
}

// ===== 일정 상태 토글 (진행 중 ↔ 완료) =====
async function toggleGoalStatus(goal) {
  try {
    const { error } = await supabase
      .from('goals')
      .update({ is_active: !goal.is_active })
      .eq('id', goal.id);

    if (error) {
      console.error('❌ 상태 업데이트 실패:', error.message);
      alert('상태 업데이트에 실패했습니다.');
      return;
    }

    // 로컬 상태 업데이트
    const goalIndex = allGoals.findIndex(g => g.id === goal.id);
    if (goalIndex !== -1) {
      allGoals[goalIndex].is_active = !allGoals[goalIndex].is_active;
      renderGoals();
    }
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  }
}

// ===== 일정 추가하기 (INSERT) =====
async function addNewGoal(title, category) {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          title: title.trim(),
          category: category,
          is_active: true
        }
      ])
      .select();

    if (error) {
      console.error('❌ 일정 추가 실패:', error.message);
      alert('일정 추가에 실패했습니다: ' + error.message);
      return false;
    }

    console.log('✅ 일정이 추가되었습니다:', data);

    // 새로운 일정을 상단에 추가
    if (data && data.length > 0) {
      allGoals.unshift(data[0]);
      renderGoals();
    }

    return true;
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    alert('일정 추가 중 오류가 발생했습니다.');
    return false;
  }
}

// ===== HTML 특수문자 이스케이프 (XSS 방지) =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== 폼 제출 이벤트 =====
goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = goalInput.value.trim();
  const category = categorySelect.value;

  if (!title) {
    alert('일정을 입력해주세요.');
    return;
  }

  // 추가 버튼 비활성화
  const submitButton = goalForm.querySelector('button');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = '추가 중...';

  // 일정 추가
  const success = await addNewGoal(title, category);

  // 버튼 상태 복원
  submitButton.disabled = false;
  submitButton.textContent = originalText;

  if (success) {
    goalInput.value = '';
    categorySelect.value = '개인';
    goalInput.focus();
  }
});

// ===== 페이지 로드 시 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 페이지 로드됨');
  fetchAllGoals();
  goalInput.focus();
});
