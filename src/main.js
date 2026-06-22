import { createClient } from '@supabase/supabase-js';

// 1. Supabase 초기화
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM 요소
const goalForm = document.getElementById('goalForm');
const goalInput = document.getElementById('goalInput');
const timeInput = document.getElementById('timeInput'); // 시간 입력 추가
const categorySelect = document.getElementById('categorySelect');
const goalsContainer = document.getElementById('goalsContainer');
const quoteElement = document.getElementById('quote');

let allGoals = [];

// 3. 기능 함수들
async function fetchQuote() {
  if (!quoteElement) return;

  const quotes = [
    { text: "꿈을 계속 간직하고 있으면 반드시 실현할 때가 온다.", author: "괴테" },
    { text: "시작이 반이다.", author: "아리스토텔레스" },
    { text: "피할 수 없으면 즐겨라.", author: "로버트 엘리엇" },
    { text: "자신을 믿는 순간, 어떻게 살아가야 할지 알게 될 것이다.", author: "괴테" },
    { text: "어제와 똑같이 살면서 다른 미래를 기대하는 것은 정신병 초기 증세이다.", author: "아인슈타인" },
    { text: "행복은 습관이다. 그것을 몸에 지니라.", author: "허버드" },
    { text: "고통 없는 승리는 영광이 없다.", author: "나폴레옹" },
    { text: "천재란 1%의 영감과 99%의 노력이다.", author: "에디슨" },
    { text: "한 번의 실패와 영원한 실패를 혼동하지 마라.", author: "스콧 피츠제럴드" },
    { text: "인생은 가까이서 보면 비극이지만, 멀리서 보면 희극이다.", author: "찰리 채플린" },
    { text: "겨울이 오면 봄이 멀지 않으리.", author: "셸리" },
    { text: "사랑받고 싶다면 사랑하라, 그리고 사랑스럽게 행동하라.", author: "벤자민 프랭클린" },
    { text: "가장 어두운 밤에도 별은 빛난다.", author: "도스토옙스키" },
    { text: "성공의 비결은 목적을 향해 시종일관하는 것이다.", author: "벤자민 디즈레일리" },
    { text: "실패는 성공이라는 요리에 풍미를 더해주는 조미료다.", author: "트루먼 카포티" },
    { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤자민 프랭클린" },
    { text: "행복은 준비된 사람의 것이다.", author: "아리스토텔레스" },
    { text: "인생은 10% 일어난 일이고, 90% 그 일에 반응하는 것이다.", author: "찰스 스윈돌" },
    { text: "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 믿는 대로 될 것이다.", author: "헨리 포드" },
    { text: "기회는 일어나는 것이 아니라 만들어내는 것이다.", author: "크리스 그로서" },
    { text: "성공은 매일 반복되는 작은 노력들의 합이다.", author: "로버트 콜리어" },
    { text: "우리는 우리가 생각하는 대로 된다.", author: "얼 나이팅게일" },
    { text: "자신을 사랑하는 것이 모든 로맨스의 시작이다.", author: "오스카 와일드" },
    { text: "꿈은 이루어진다. 이루어질 가능성이 없었다면 애초에 자연이 우리를 꿈꾸게 하지 않았을 것이다.", author: "존 업다이크" },
    { text: "어제의 나보다 조금 더 나아지는 것이 중요하다.", author: "공자" },
    { text: "지식은 힘이다.", author: "프랜시스 베이컨" },
    { text: "위대한 정신은 평범한 사람들이 갖지 못한 의지를 가지고 있다.", author: "윌슨" },
    { text: "진정한 발견은 새로운 땅을 찾는 것이 아니라 새로운 눈으로 보는 것이다.", author: "마르셀 프루스트" },
    { text: "불가능이란 노력하지 않는 사람의 변명이다.", author: "나폴레옹" },
    { text: "끝날 때까지는 끝난 게 아니다.", author: "요기 베라" }
  ];

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const selectedQuote = quotes[randomIndex];

  quoteElement.innerHTML = `"${selectedQuote.text}"<br><small>- ${selectedQuote.author} -</small>`;
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
      <span class="goal-category">${goal.category || '기타'} | ${goal.time || '시간 미지정'}</span>
      <span class="goal-title">${escapeHtml(goal.title)}</span>
    </div>
    <button class="delete-btn" style="background:none; border:none; cursor:pointer; font-size:18px;">🗑️</button>
  `;
  
  // 토글 이벤트
  div.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) toggleGoalStatus(goal);
  });
  
  // 삭제 이벤트
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
  const { data, error } = await supabase.from('goals').insert([{ title, category, time, is_active: true }]).select();
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
  const success = await addNewGoal(goalInput.value.trim(), categorySelect.value, timeInput.value);
  if (success) {
    goalInput.value = '';
    timeInput.value = '';
    goalInput.focus();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetchQuote();
  fetchAllGoals();
});