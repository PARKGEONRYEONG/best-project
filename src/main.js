import { createClient } from '@supabase/supabase-js';
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const goalForm = document.getElementById('goalForm');
const goalInput = document.getElementById('goalInput');
const timeInput = document.getElementById('timeInput'); 
const categorySelect = document.getElementById('categorySelect');
const goalsContainer = document.getElementById('goalsContainer');
const quoteElement = document.getElementById('quote');
const datePickerInput = document.getElementById('datePicker');

let allGoals = [];

// 1. 달력 초기화
flatpickr("#datePicker", {
  dateFormat: "Y-m-d",
  defaultDate: new Date(),
  onChange: function(selectedDates, dateStr) {
    fetchGoalsByDate(dateStr);
  }
});

// 2. 날짜별 일정 가져오기
async function fetchGoalsByDate(date) {
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('created_at', date) // Supabase 테이블의 날짜 컬럼 이름이 'created_at'이라고 가정합니다.
    .order('created_at', { ascending: false });
  
  allGoals = data || [];
  renderGoals();
}

// 명언, 기본 함수들
async function fetchQuote() {
  if (!quoteElement) return;
  const quotes = [
    { text: "시작이 반이다.", author: "아리스토텔레스" },
    { text: "피할 수 없으면 즐겨라.", author: "로버트 엘리엇" },
    { text: "고통 없는 승리는 영광이 없다.", author: "나폴레옹" }
  ];
  const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
  quoteElement.innerHTML = `"${selectedQuote.text}"<br><small>- ${selectedQuote.author} -</small>`;
}

function renderGoals() {
  goalsContainer.innerHTML = '';
  if (allGoals.length === 0) {
    goalsContainer.innerHTML = '<div class="empty-state" style="text-align:center; padding:20px; color:#888;">일정이 없습니다.</div>';
    return;
  }
  allGoals.forEach(goal => goalsContainer.appendChild(createGoalElement(goal)));
}

function createGoalElement(goal) {
  const div = document.createElement('div');
  div.className = `goal-item ${goal.is_active ? '' : 'completed'}`;
  div.innerHTML = `
    <div class="goal-content">
      <span class="goal-category">${goal.category || '기타'} | ${goal.time || '시간 미지정'}</span>
      <span class="goal-title">${escapeHtml(goal.title)}</span>
    </div>
    <div class="action-box">
      <span class="goal-status ${goal.is_active ? 'active' : 'completed'}">
        ${goal.is_active ? '진행 중' : '✓ 완료'}
      </span>
      <button class="delete-btn">🗑️</button>
    </div>
  `;
  div.addEventListener('click', (e) => { if (!e.target.classList.contains('delete-btn')) toggleGoalStatus(goal); });
  div.querySelector('.delete-btn').addEventListener('click', (e) => deleteGoal(e, goal.id));
  return div;
}

async function toggleGoalStatus(goal) {
  const { error } = await supabase.from('goals').update({ is_active: !goal.is_active }).eq('id', goal.id);
  if (!error) {
    allGoals = allGoals.map(g => g.id === goal.id ? { ...g, is_active: !g.is_active } : g);
    renderGoals();
  }
}

async function deleteGoal(event, goalId) {
  event.stopPropagation();
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (!error) {
    allGoals = allGoals.filter(g => g.id !== goalId);
    renderGoals();
  }
}

async function addNewGoal(title, category, time) {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 저장
  const date = document.getElementById('datePicker').value;
  const { data, error } = await supabase.from('goals').insert([{ title, category, time, is_active: true, created_at: date }]).select();
  if (error) { alert('추가 실패: ' + error.message); return false; }
  allGoals.unshift(data[0]);
  renderGoals();
  return true;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const success = await addNewGoal(goalInput.value.trim(), categorySelect.value, timeInput.value);
  if (success) { goalInput.value = ''; timeInput.value = ''; goalInput.focus(); }
});

document.addEventListener('DOMContentLoaded', () => { 
  fetchQuote(); 
  fetchGoalsByDate(new Date().toISOString().split('T')[0]); 
});