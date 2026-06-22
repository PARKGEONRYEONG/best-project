import { createClient } from '@supabase/supabase-js';
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const goalForm = document.getElementById('goalForm');
const goalInput = document.getElementById('goalInput');
const timeInput = document.getElementById('timeInput'); 
const categorySelect = document.getElementById('categorySelect');
const goalsContainer = document.getElementById('goalsContainer');
const quoteElement = document.getElementById('quote');

let allGoals = [];

flatpickr("#datePicker", { dateFormat: "Y-m-d", defaultDate: new Date(), onChange: (_, dateStr) => fetchGoalsByDate(dateStr) });

async function fetchGoalsByDate(date) {
  const { data } = await supabase.from('goals').select('*').eq('created_at', date).order('created_at', { ascending: false });
  allGoals = data || [];
  renderGoals();
}

function renderGoals() {
  goalsContainer.innerHTML = allGoals.length === 0 ? '<div style="text-align:center; padding:20px; color:#888;">일정이 없습니다.</div>' : '';
  allGoals.forEach(goal => goalsContainer.appendChild(createGoalElement(goal)));
}

function createGoalElement(goal) {
  const div = document.createElement('div');
  div.className = `goal-item ${goal.is_active ? '' : 'completed'}`;
  div.innerHTML = `
    <div class="goal-content">
      <span class="goal-category">${goal.category} | ${goal.time || '미지정'}</span>
      <span class="goal-title">${goal.title}</span>
    </div>
    <div class="action-box">
      <span class="goal-status">${goal.is_active ? '진행 중' : '✓ 완료'}</span>
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

async function deleteGoal(e, goalId) {
  e.stopPropagation();
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (!error) {
    allGoals = allGoals.filter(g => g.id !== goalId);
    renderGoals();
  }
}

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('datePicker').value;
  const { data, error } = await supabase.from('goals').insert([{ title: goalInput.value, category: categorySelect.value, time: timeInput.value, is_active: true, created_at: date }]).select();
  if (!error) { allGoals.unshift(data[0]); goalInput.value = ''; renderGoals(); }
});

document.addEventListener('DOMContentLoaded', () => { fetchGoalsByDate(new Date().toISOString().split('T')[0]); });