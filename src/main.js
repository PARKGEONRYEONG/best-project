import { createClient } from '@supabase/supabase-js';

// 1. Supabase 초기화
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM 요소
const goalForm = document.getElementById('goalForm');
const goalInput = document.getElementById('goalInput');
const categorySelect = document.getElementById('categorySelect');
const goalsContainer = document.getElementById('goalsContainer');
const quoteElement = document.getElementById('quote');

let allGoals = [];

// 3. 기능 함수들
async function fetchQuote() {
  if (!quoteElement) return;
  try {
    const res = await fetch('https://api.adviceslip.com/advice');
    const data = await res.json();
    quoteElement.innerText = data.slip.advice;
  } catch (e) {
    quoteElement.innerText = "오늘도 최선을 다하는 당신을 응원합니다!";
  }
}

async function fetchAllGoals() {
  const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
  allGoals = data || [];
  renderGoals();
}

function renderGoals() {
  goalsContainer.innerHTML = '';
  if (allGoals.length === 0) {
    goalsContainer.innerHTML = '<div class="empty-state">일정이 없습니다.</div>';
    return;
  }
  allGoals.forEach(goal => goalsContainer.appendChild(createGoalElement(goal)));
}

function createGoalElement(goal) {
  const div = document.createElement('div');
  div.className = `goal-item ${goal.is_active ? '' : 'completed'}`;
  div.innerHTML = `
    <div class="goal-content">
      <span class="goal-category">${goal.category || '기타'}</span>
      <span class="goal-title">${escapeHtml(goal.title)}</span>
    </div>
    <div class="goal-status ${goal.is_active ? 'active' : 'completed'}">
      ${goal.is_active ? '진행 중' : '✓ 완료'}
    </div>
  `;
  div.addEventListener('click', () => toggleGoalStatus(goal));
  return div;
}

async function toggleGoalStatus(goal) {
  const { error } = await supabase.from('goals').update({ is_active: !goal.is_active }).eq('id', goal.id);
  if (!error) {
    allGoals = allGoals.map(g => g.id === goal.id ? { ...g, is_active: !g.is_active } : g);
    renderGoals();
  }
}

async function addNewGoal(title, category) {
  const { data, error } = await supabase.from('goals').insert([{ title, category, is_active: true }]).select();
  if (error) {
    alert('추가 실패: ' + error.message);
    return false;
  }
  allGoals.unshift(data[0]);
  renderGoals();
  return true;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 4. 이벤트 및 초기화
goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const success = await addNewGoal(goalInput.value.trim(), categorySelect.value);
  if (success) {
    goalInput.value = '';
    goalInput.focus();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetchQuote();
  fetchAllGoals();
});